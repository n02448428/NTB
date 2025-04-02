// js/onlineLeaderboard.js - Minimal version to restore game functionality
// This file just reimplements the original local storage leaderboard

function setupOnlineLeaderboard() {
  console.log("Using local storage leaderboard only");
  
  // No need to redefine these functions if they already exist
  // Just use them as is from the existing implementation
  if (typeof window.addToLeaderboard === 'undefined') {
    // Define only if not already defined
    window.addToLeaderboard = function(name, score) {
      console.log(`Saving score locally: ${name} - ${score}`);
      
      const leaderboard = JSON.parse(localStorage.getItem('neonTrailblazerLeaderboard') || '[]');
      leaderboard.push({
        name: name,
        score: score,
        date: new Date().toISOString()
      });
      
      leaderboard.sort((a, b) => b.score - a.score);
      localStorage.setItem('neonTrailblazerLeaderboard', JSON.stringify(leaderboard));
    };
  }
  
  if (typeof window.showLeaderboard === 'undefined') {
    // Define only if not already defined
    window.showLeaderboard = function() {
      const leaderboard = JSON.parse(localStorage.getItem('neonTrailblazerLeaderboard') || '[]');
      const leaderboardBody = document.getElementById('leaderboardBody');
      
      if (!leaderboardBody) {
        console.error("Leaderboard body element not found");
        return;
      }
      
      leaderboardBody.innerHTML = '';
      
      if (leaderboard.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4">No scores yet</td>';
        leaderboardBody.appendChild(row);
      } else {
        leaderboard.sort((a, b) => b.score - a.score);
        
        for (let i = 0; i < Math.min(10, leaderboard.length); i++) {
          const entry = leaderboard[i];
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${i + 1}</td>
            <td>${entry.name}</td>
            <td>${entry.score}</td>
            <td>${new Date(entry.date).toLocaleDateString()}</td>
          `;
          leaderboardBody.appendChild(row);
        }
      }
      
      const panel = document.getElementById('leaderboardPanel');
      if (panel) {
        panel.style.display = 'block';
      }
    };
  }
  
  if (typeof window.hideLeaderboard === 'undefined') {
    // Define only if not already defined
    window.hideLeaderboard = function() {
      const panel = document.getElementById('leaderboardPanel');
      if (panel) {
        panel.style.display = 'none';
      }
    };
  }
  
  console.log("Leaderboard functions initialized");
}

// This is a safety check to make sure the function gets called
// even if someone forgot to call it in main.js
if (document.readyState === "complete" || document.readyState === "interactive") {
  // If page is already loaded
  setTimeout(setupOnlineLeaderboard, 1);
} else {
  // If page is still loading
  document.addEventListener("DOMContentLoaded", setupOnlineLeaderboard);
}

// Also attempt to initialize immediately
setupOnlineLeaderboard();
