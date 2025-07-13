import { getSheetRecords } from "@/lib/gsheet";
import { NextResponse } from "next/server";

const sheetKey = process.env.TEST_RESPONSES_SHEET_KEY;

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
    
    return NextResponse.json({
        leaderboard: leaderboardData,
        raw: {
            submissions,
            gamequeue,
            votes
        }
    });
}

function processLeaderboardData(submissions, gamequeue, votes) {
    // Create a map of all players
    const playersMap = new Map();
    
    // Initialize players from submissions
    submissions.forEach(submission => {
        const playerId = submission["What's your Slack ID?"];
        const playerName = submission.Name;
        
        if (!playersMap.has(playerId)) {
            playersMap.set(playerId, {
                id: playerId,
                name: playerName,
                totalGuesses: 0,
                correctGuesses: 0,
                accuracy: 0,
                recentActivity: "No activity yet",
                detailsBreakdown: []
            });
        }
    });
    
    // Initialize players from votes if they're not in submissions
    votes.forEach(vote => {
        const playerId = vote["Submitted By (ID)"];
        const playerName = vote["Submitted By (Name)"];
        
        if (!playersMap.has(playerId)) {
            playersMap.set(playerId, {
                id: playerId,
                name: playerName,
                totalGuesses: 0,
                correctGuesses: 0,
                accuracy: 0,
                recentActivity: "No activity yet",
                detailsBreakdown: []
            });
        }
    });
    
    // Filter and process valid votes
    const validVotes = getValidVotes(votes, gamequeue);
    
    // Process valid votes to calculate statistics
    validVotes.forEach(vote => {
        const voterId = vote["Submitted By (ID)"];
        const voterName = vote["Submitted By (Name)"];
        const targetId = vote["Vote for who"];
        const guessedStatementIndex = parseInt(vote["Which one do you think is the lie"]) - 1; // Convert to 0-indexed
        const voteTimestamp = vote.Timestamp;
        
        const voter = playersMap.get(voterId);
        if (!voter) return;
        
        // Find the corresponding game in gamequeue
        const correspondingGame = findCorrespondingGame(gamequeue, targetId);
        
        if (correspondingGame) {
            const correctLieIndex = parseInt(correspondingGame["Lie Index (start from 0)"]);
            const isCorrect = guessedStatementIndex === correctLieIndex;
            const targetName = correspondingGame.Name;
            
            // Update voter's statistics
            voter.totalGuesses++;
            if (isCorrect) {
                voter.correctGuesses++;
            }
            
            // Update accuracy
            voter.accuracy = voter.totalGuesses > 0 ? Math.round((voter.correctGuesses / voter.totalGuesses) * 100) : 0;
            
            // Update recent activity
            const activityVerb = isCorrect ? "correctly guessed" : "incorrectly guessed";
            voter.recentActivity = `${activityVerb} ${targetName}'s lie`;
            
            // Add to details breakdown
            const guessedStatement = getStatementByIndex(correspondingGame, guessedStatementIndex);
            voter.detailsBreakdown.push({
                target: targetName,
                targetId: targetId,
                guess: `Statement ${guessedStatementIndex + 1}`,
                guessedStatement: guessedStatement,
                wasCorrect: isCorrect,
                timestamp: voteTimestamp
            });
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
        
        // Check if the game was revealed before the vote
        const revealedAt = correspondingGame["Revealed At"];
        const isGameRevealed = correspondingGame["Revealed?"] === "1";
        console.log(`Processing votes for target: ${targetId}, Revealed: ${isGameRevealed}, Revealed At: ${revealedAt}`);
        
        // For each voter who voted on this target
        voterMap.forEach((voterVotes, voterId) => {
            // Sort votes by timestamp (latest first)
            voterVotes.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
            
            // Find the latest valid vote (before revelation)
            let latestValidVote = null;
            
            for (const vote of voterVotes) {
                const voteDate = new Date(vote.Timestamp);
                
                // If game is revealed, check if vote was made before revelation
                if (isGameRevealed && revealedAt) {
                    const revelationDate = new Date(revealedAt);
                    if (voteDate < revelationDate) {
                        latestValidVote = vote;
                        break; // Found the latest valid vote
                    }
                } else if (!isGameRevealed) {
                    // Game not revealed yet, so this vote is valid
                    latestValidVote = vote;
                    break;
                }
            }
            
            if (latestValidVote) {
                validVotes.push(latestValidVote);
            }
        });
    });
    console.log("Valid Votes Count: ", validVotes);
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