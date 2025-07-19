import { getSheetRecords } from "@/lib/gsheet";
import { NextResponse } from "next/server";

const sheetKey = process.env.RESPONSES_SHEET_KEY;

export async function GET() {
    let submissions = [];
    let gamequeue = [];
    let votes = [];
    
    try {
        submissions = await getSheetRecords(sheetKey, "Submissions!A:H");
        gamequeue = await getSheetRecords(sheetKey, "GameQueue!A:I");
        votes = await getSheetRecords(sheetKey, "Votes!A:H");
    } catch (error) {
        console.error("Error fetching sheets:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }

    // Process data into leaderboard format
    const leaderboardData = processLeaderboardData(submissions, gamequeue, votes);

    console.log("Helper Data: ", getGameStatistics(gamequeue));
    
    // Filter votes to only include those for revealed games
    const filteredVotes = votes.filter(vote => {
        const targetId = vote["Vote for who"];
        const correspondingGame = findCorrespondingGame(gamequeue, targetId);
        return correspondingGame && correspondingGame["Revealed?"] === "1";
    });

    return NextResponse.json({
        leaderboard: leaderboardData,
        raw: {
            submissions,
            gamequeue,
            votes: filteredVotes
        }
    });
}

function processLeaderboardData(submissions, gamequeue, votes) {
    // Check if any games are revealed
    const hasRevealedGames = gamequeue.some(game => game["Revealed?"] === "1");
    if (!hasRevealedGames) {
        return []; // Return empty leaderboard if no games revealed
    }
    
    // Create a map of all players
    const playersMap = new Map();
    
    // Filter and process valid votes (only for revealed games)
    const validVotes = getValidVotes(votes, gamequeue);
    
    // Initialize all players who have made votes (check all votes, not just valid ones)
    votes.forEach(vote => {
        const voterId = vote["Submitted By (ID)"];
        const voterName = vote["Submitted By (Name)"];
        const targetId = vote["Vote for who"];
        
        // Check if this vote is for a revealed game
        const correspondingGame = findCorrespondingGame(gamequeue, targetId);
        if (correspondingGame && correspondingGame["Revealed?"] === "1") {
            if (!playersMap.has(voterId)) {
                playersMap.set(voterId, {
                    id: voterId,
                    name: voterName,
                    totalGuesses: 0,
                    correctGuesses: 0,
                    accuracy: 0,
                    recentActivity: "No activity yet",
                    detailsBreakdown: []
                });
            }
        }
    });
    
    // Process valid votes to calculate statistics
    validVotes.forEach(vote => {
        const voterId = vote["Submitted By (ID)"];
        const targetId = vote["Vote for who"];
        const guessedStatementIndex = parseInt(vote["Which one do you think is the lie"]) - 1;
        const voteTimestamp = vote.Timestamp;
        
        // Add validation for parsed data
        if (isNaN(guessedStatementIndex) || guessedStatementIndex < 0 || guessedStatementIndex > 2) {
            console.warn(`Invalid statement index for vote: ${vote.Timestamp}`);
            return;
        }
        
        const voter = playersMap.get(voterId);
        if (!voter) return;
        
        // Find the corresponding game in gamequeue
        const correspondingGame = findCorrespondingGame(gamequeue, targetId);
        
        if (correspondingGame) {
            const targetName = correspondingGame.Name;
            
            // Since validVotes only contains revealed games, we can process normally
            const correctLieIndex = parseInt(correspondingGame["Lie Index (start from 0)"]);
            
            // Validate lie index
            if (isNaN(correctLieIndex) || correctLieIndex < 0 || correctLieIndex > 2) {
                console.warn(`Invalid lie index for game: ${targetId}`);
                return;
            }
            
            const isCorrect = guessedStatementIndex === correctLieIndex;
            
            // Count the vote as a guess
            voter.totalGuesses++;
            
            if (isCorrect) {
                voter.correctGuesses++;
            }
            
            // Update recent activity with result
            const activityVerb = isCorrect ? "correctly guessed" : "incorrectly guessed";
            voter.recentActivity = `${activityVerb} ${targetName}'s lie`;
            
            // Add to details breakdown with result
            const guessedStatement = getStatementByIndex(correspondingGame, guessedStatementIndex);
            voter.detailsBreakdown.push({
                target: targetName,
                targetId: targetId,
                guess: `Statement ${guessedStatementIndex + 1}`,
                guessedStatement: guessedStatement,
                wasCorrect: isCorrect,
                timestamp: voteTimestamp,
                revealed: true
            });
            
            // Update accuracy (all votes are now for revealed games)
            voter.accuracy = voter.totalGuesses > 0 ? Math.round((voter.correctGuesses / voter.totalGuesses) * 100) : 0;
        }
    });
    
    // Convert map to array and sort by correct guesses, then by accuracy
    const leaderboard = Array.from(playersMap.values()).sort((a, b) => {
        if (b.correctGuesses !== a.correctGuesses) {
            return b.correctGuesses - a.correctGuesses;
        }
        return b.accuracy - a.accuracy;
    });
    
    return leaderboard;
}

function getValidVotes(votes, gamequeue) {
    // Group votes by target player and voter
    const votesByTarget = new Map();
    
    votes.forEach(vote => {
        const targetId = vote["Vote for who"];
        const voterId = vote["Submitted By (ID)"];
        const voteTimestamp = vote.Timestamp;
        
        if (!votesByTarget.has(targetId)) {
            votesByTarget.set(targetId, new Map());
        }
        
        if (!votesByTarget.get(targetId).has(voterId)) {
            votesByTarget.get(targetId).set(voterId, []);
        }
        
        votesByTarget.get(targetId).get(voterId).push(vote);
    });
    
    const validVotes = [];
    
    // For each target, process their votes
    votesByTarget.forEach((voterMap, targetId) => {
        // Find the corresponding game for this target
        const correspondingGame = findCorrespondingGame(gamequeue, targetId);
        
        if (!correspondingGame) return;
        
        // Only process votes for revealed games
        const isGameRevealed = correspondingGame["Revealed?"] === "1";
        if (!isGameRevealed) {
            return; // Skip unrevealed games entirely
        }
        
        const revealedAt = correspondingGame["Revealed At"];
        
        // Convert revealed date to 6am PST timestamp if it's just a date
        let revelationDate = null;
        if (revealedAt) {
            if (revealedAt.includes('1:00:00 PM')) {
                // Already has time, use as is
                revelationDate = new Date(revealedAt);
            } else {
                // Just a date, convert to 6am PST
                const datePart = revealedAt.split(' ')[0]; // Get just the date part
                revelationDate = new Date(`${datePart} 1:00:00 PM`);
            }
        }
        
        console.log(`Processing votes for revealed target: ${targetId}, Revealed At: ${revelationDate}`);
        
        // For each voter who voted on this target
        voterMap.forEach((voterVotes, voterId) => {
            // Sort votes by timestamp (latest first)
            voterVotes.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
            
            // Find the latest valid vote (before revelation)
            let latestValidVote = null;
            
            for (const vote of voterVotes) {
                // Convert UTC timestamp to IST (UTC + 5:30)
                const voteDate = new Date(vote.Timestamp);
                const voteIST = new Date(voteDate.getTime() + (5.5 * 60 * 60 * 1000));
                                            
                // Check if vote was made before revelation
                if (revelationDate) {
                    if (voteIST < revelationDate) {
                        latestValidVote = vote;
                        break; // Found the latest valid vote
                    }
                } else {
                    // No revelation timestamp, use the latest vote
                    latestValidVote = vote;
                    break;
                }
            }
            
            if (latestValidVote) {
                validVotes.push(latestValidVote);
            }
        });
    });
    return validVotes;
}

function findCorrespondingGame(gamequeue, targetId) {
    // Since Slack ID is unique in gamequeue, find the game for this target
    return gamequeue.find(game => game["Slack ID"] === targetId);
}

function getStatementByIndex(game, index) {
    switch (index) {
        case 0: return game["Statement 1"];
        case 1: return game["Statement 2"];
        case 2: return game["Statement 3"];
        default: return "Unknown statement";
    }
}

// Helper function to get game statistics (optional - for debugging)
function getGameStatistics(gamequeue) {
    const stats = {
        totalGames: gamequeue.length,
        revealedGames: gamequeue.filter(game => game["Revealed?"] === "1").length,
        pendingGames: gamequeue.filter(game => game["Revealed?"] === "0").length,
        playerBreakdown: {}
    };
    
    gamequeue.forEach(game => {
        const playerId = game["Slack ID"];
        const playerName = game.Name;
        
        if (!stats.playerBreakdown[playerId]) {
            stats.playerBreakdown[playerId] = {
                name: playerName,
                totalGames: 0,
                revealedGames: 0
            };
        }
        
        stats.playerBreakdown[playerId].totalGames++;
        if (game["Revealed?"] === "1") {
            stats.playerBreakdown[playerId].revealedGames++;
        }
    });
    
    return stats;
}