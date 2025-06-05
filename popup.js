document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.getElementById('sessionToggleButton');
    const statusMessage = document.getElementById('statusMessage');
    const timerDisplay = document.getElementById('timerDisplay');
    let updateInterval;

    function updateUI(isSessionActive, startTime = 0) {
        if (isSessionActive) {
            toggleButton.textContent = "End Private Session (Clear History)";
            toggleButton.classList.remove('start');
            toggleButton.classList.add('end');
            statusMessage.textContent = "Private session is active.";
            if (startTime > 0) {
                clearInterval(updateInterval); // Xóa interval cũ nếu có
                updateInterval = setInterval(() => {
                    const now = Date.now();
                    const elapsed = now - startTime;
                    const seconds = Math.floor((elapsed / 1000) % 60);
                    const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
                    const hours = Math.floor((elapsed / (1000 * 60 * 60)) % 24);
                    timerDisplay.textContent = `Elapsed: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }, 1000);
            }
        } else {
            toggleButton.textContent = "Start Private Session";
            toggleButton.classList.remove('end');
            toggleButton.classList.add('start');
            statusMessage.textContent = "Private session is inactive.";
            timerDisplay.textContent = "";
            clearInterval(updateInterval); // Dừng cập nhật timer
        }
    }

    chrome.runtime.sendMessage({ action: "getStatus" }, function(response) {
        if (response) {
            updateUI(response.isSessionActive, response.startTime);
        }
    });

    toggleButton.addEventListener('click', function() {
        toggleButton.disabled = true;
        statusMessage.textContent = "Processing request...";

        chrome.runtime.sendMessage({ action: "toggleSession" }, function(response) {
            if (chrome.runtime.lastError) {
                statusMessage.textContent = `Error: ${chrome.runtime.lastError.message}`;
                console.error("Message sending failed:", chrome.runtime.lastError);
            } else if (response) {
                updateUI(response.isSessionActive, response.startTime);
                if (!response.isSessionActive && response.clearedSuccessfully) {
                    statusMessage.textContent = "History cleared successfully!";
                } else if (!response.isSessionActive && !response.clearedSuccessfully) {
                    statusMessage.textContent = "Session ended. Failed to clear history.";
                }
            }
            toggleButton.disabled = false;
        });
    });

    window.addEventListener('beforeunload', () => {
        clearInterval(updateInterval);
    });
});