document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('toggleButton');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const delayInput = document.getElementById('delayTime');
  
  chrome.storage.sync.get(['enabled', 'delayTime'], function(data) {
    const enabled = data.enabled || false;
    const delayTime = data.delayTime || 1;
    
    updateUI(enabled);
    delayInput.value = delayTime;
  });
  
  toggleButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      if (currentTab && currentTab.url.includes('aitrain.zjer.cn')) {
        chrome.storage.sync.get(['enabled'], function(data) {
          const newState = !data.enabled;
          const delayTime = parseInt(delayInput.value) || 1;
          
          chrome.storage.sync.set({
            enabled: newState,
            delayTime: delayTime
          });

          chrome.tabs.sendMessage(currentTab.id, {
            action: "toggle",
            enabled: newState,
            delayTime: delayTime
          });
          
          updateUI(newState);
        });
      } else {
        statusText.textContent = '请在之江汇网站上使用此功能';
        statusIndicator.className = 'status-indicator status-disabled';
      }
    });
  });

  delayInput.addEventListener('change', function() {
    const delayTime = parseInt(delayInput.value) || 1;
    chrome.storage.sync.set({delayTime: delayTime});
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      if (currentTab && currentTab.url.includes('aitrain.zjer.cn')) {
        chrome.tabs.sendMessage(currentTab.id, {
          action: "updateDelay",
          delayTime: delayTime
        });
      }
    });
  });
  
  function updateUI(enabled) {
    if (enabled) {
      statusIndicator.className = 'status-indicator status-enabled';
      statusText.textContent = '自动切换已启用';
      toggleButton.textContent = '禁用自动切换';
    } else {
      statusIndicator.className = 'status-indicator status-disabled';
      statusText.textContent = '自动切换已禁用';
      toggleButton.textContent = '启用自动切换';
    }
  }
});
