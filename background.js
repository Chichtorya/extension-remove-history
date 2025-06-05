let isSessionActive = false;
let sessionStartTime = 0;

// --- Khởi tạo trạng thái từ storage ---
chrome.storage.local.get(['isSessionActive', 'sessionStartTime'], function (result) {
    isSessionActive = result.isSessionActive || false;
    sessionStartTime = result.sessionStartTime || 0;
});

// --- Hàm xóa lịch sử ---
async function clearHistoryRange(start, end) {
    if (start === 0 || end < start) {
        return false;
    }
    try {
        await chrome.history.deleteRange({
            startTime: start,
            endTime: end
        });
        return true;
    } catch (error) {
        return false;
    }
}

// --- Lắng nghe message từ Popup hoặc các phần khác ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const handleMessage = async () => {
        if (request.action === "getStatus") {
            sendResponse({
                isSessionActive: isSessionActive,
                startTime: sessionStartTime
            });
        } else if (request.action === "toggleSession") {
            if (isSessionActive) {
                // --- KẾT THÚC PHIÊN ---
                const historyToClearFrom = sessionStartTime;
                const historyToClearTo = Date.now();

                isSessionActive = false;
                sessionStartTime = 0;

                await chrome.storage.local.set({ isSessionActive: false, sessionStartTime: 0 });

                const clearedSuccessfully = await clearHistoryRange(historyToClearFrom, historyToClearTo);

                sendResponse({
                    isSessionActive: isSessionActive,
                    clearedSuccessfully: clearedSuccessfully
                });

            } else {
                // --- BẮT ĐẦU PHIÊN ---
                sessionStartTime = Date.now();
                isSessionActive = true;

                await chrome.storage.local.set({
                    isSessionActive: true,
                    sessionStartTime: sessionStartTime
                });

                sendResponse({
                    isSessionActive: isSessionActive,
                    startTime: sessionStartTime
                });
            }
        }
    };
    handleMessage();
    return true;
});

// --- Xử lý khi trình duyệt sắp đóng ---
chrome.runtime.onSuspend.addListener(function () {
    if (isSessionActive) {
        const historyToClearFrom = sessionStartTime;
        const historyToClearTo = Date.now();

        isSessionActive = false;
        sessionStartTime = 0;
        chrome.storage.local.set({ isSessionActive: false, sessionStartTime: 0 });

        clearHistoryRange(historyToClearFrom, historyToClearTo);
    }
});

// --- Xử lý khi Extension được cài đặt lần đầu ---
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ isSessionActive: false, sessionStartTime: 0 });
});