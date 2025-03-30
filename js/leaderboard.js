/* ------------------ LEADERBOARD SYSTEM ------------------ */

function showLeaderboard() {
    const leaderboard = getLeaderboard();
    const leaderboardBody = document.getElementById('leaderboardBody');
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
          <td>${UTILS.formatDate(entry.date)}</td>
        `;
  
        leaderboardBody.appendChild(row);
      }
    }
  
    document.getElementById('leaderboardPanel').style.display = 'block';
  }
  
  function hideLeaderboard() {
    document.getElementById('leaderboardPanel').style.display = 'none';
  }
  
  function getLeaderboard() {
    return JSON.parse(localStorage.getItem('neonTrailblazerLeaderboard') || '[]');
  }
  
  function addToLeaderboard(name, score) {
    const leaderboard = getLeaderboard();
    leaderboard.push({
      name: name,
      score: score,
      date: new Date().toISOString()
    });
  
    leaderboard.sort((a, b) => b.score - a.score);
    const limitedLeaderboard = leaderboard.slice(0, 50);
  
    localStorage.setItem('neonTrailblazerLeaderboard', JSON.stringify(limitedLeaderboard));
  }
  
  function setupOnlineLeaderboard() {
    const API_URL = 'https://ntb-chi.vercel.app/api/leaderboard';
  
    // Function to save score
    async function saveScoreToLeaderboard(name, score) {
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, score }),
        });
    
        if (!response.ok) {
          console.warn('Online leaderboard not available - score saved locally only');
          return false;
        }
    
        return true;
      } catch (error) {
        console.warn('Error saving score online - score saved locally only:', error);
        return false;
      }
    }
  
    // Function to fetch and display leaderboard
    async function displayOnlineLeaderboard() {
      try {
        const response = await fetch(API_URL);
  
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }
  
        const scores = await response.json();
        const leaderboardBody = document.getElementById('leaderboardBody');
        leaderboardBody.innerHTML = '';
  
        if (scores.length === 0) {
          const row = document.createElement('tr');
          row.innerHTML = '<td colspan="4">No scores yet</td>';
          leaderboardBody.appendChild(row);
        } else {
          scores.forEach((entry) => {
            const row = document.createElement('tr');
            row.innerHTML = `
          <td>${entry.rank}</td>
          <td>${entry.name}</td>
          <td>${entry.score}</td>
          <td>${UTILS.formatDate(entry.date)}</td>
        `;
            leaderboardBody.appendChild(row);
          });
        }
  
        // Add "ONLINE" indicator
        const leaderboardTitle = document.querySelector('#leaderboardPanel h2');
        leaderboardTitle.innerHTML = 'LEADERBOARD <span style="color:#0f0;font-size:14px;">[ONLINE]</span>';
  
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        // Fallback to local leaderboard
        showLocalLeaderboard();
      }
    }
  
    function showLocalLeaderboard() {
      const leaderboard = getLeaderboard();
      const leaderboardBody = document.getElementById('leaderboardBody');
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
        <td>${UTILS.formatDate(entry.date)}</td>
      `;
  
          leaderboardBody.appendChild(row);
        }
      }
  
      // Add "LOCAL" indicator
      const leaderboardTitle = document.querySelector('#leaderboardPanel h2');
      leaderboardTitle.innerHTML = 'LEADERBOARD <span style="color:#ff0;font-size:14px;">[LOCAL]</span>';
    }
  
    // Override the addToLeaderboard function
    window.addToLeaderboard = function (name, score) {
      // Still save locally for fallback
      const leaderboard = getLeaderboard();
      leaderboard.push({
        name: name,
        score: score,
        date: new Date().toISOString()
      });
  
      leaderboard.sort((a, b) => b.score - a.score);
      const limitedLeaderboard = leaderboard.slice(0, 50);
      localStorage.setItem('neonTrailblazerLeaderboard', JSON.stringify(limitedLeaderboard));
  
      // Also try to save online
      saveScoreToLeaderboard(name, score).catch(console.error);
    };
  
    // Override the showLeaderboard function
    window.showLeaderboard = function () {
      displayOnlineLeaderboard().catch(() => {
        showLocalLeaderboard();
      });
      document.getElementById('leaderboardPanel').style.display = 'block';
    };
  
    // Add toggle button
    const leaderboardPanel = document.getElementById('leaderboardPanel');
    const toggleButton = document.createElement('button');
    toggleButton.id = 'toggleLeaderboard';
    toggleButton.textContent = 'SHOW LOCAL';
    toggleButton.style.marginLeft = '10px';
  
    const closeButton = document.getElementById('closeLeaderboard');
    closeButton.parentNode.insertBefore(toggleButton, closeButton.nextSibling);
  
    let showingOnline = true;
    toggleButton.addEventListener('click', () => {
      if (showingOnline) {
        showLocalLeaderboard();
        toggleButton.textContent = 'SHOW ONLINE';
        showingOnline = false;
      } else {
        displayOnlineLeaderboard();
        toggleButton.textContent = 'SHOW LOCAL';
        showingOnline = true;
      }
    });
  }