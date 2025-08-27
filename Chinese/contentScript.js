(function() {
  let enabled = false;
  let delayTime = 0;
  let videoObserver = null;
  let nextButtonObserver = null;
  
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "toggle") {
      enabled = request.enabled;
      delayTime = request.delayTime * 1000;
      
      if (enabled) {
        startAutoSwitch();
      } else {
        stopAutoSwitch();
      }
      
      sendResponse({status: "success"});
    } else if (request.action === "updateDelay") {
      delayTime = request.delayTime * 1000;
      sendResponse({status: "success"});
    } else if (request.action === "getStatus") {
      sendResponse({enabled: enabled, delayTime: delayTime});
    }
    return true;
  });
  
  chrome.storage.sync.get(['enabled', 'delayTime'], function(data) {
    if (data.enabled) {
      enabled = data.enabled;
      delayTime = (data.delayTime || 1) * 1000;
      startAutoSwitch();
    }
  });
  
  function startAutoSwitch() {
    console.log('视频连播已启用');
    findAndMonitorVideo();
    if (!videoObserver) {
      videoObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (!document.querySelector('video')) {
            findAndMonitorVideo();
          }
        });
      });
      
      videoObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }
  
  function stopAutoSwitch() {
    console.log('视频连播已禁用');
    
    if (videoObserver) {
      videoObserver.disconnect();
      videoObserver = null;
    }
    
    if (nextButtonObserver) {
      nextButtonObserver.disconnect();
      nextButtonObserver = null;
    }

    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      video.removeEventListener('ended', handleVideoEnded);
    });
  }
  
  function findAndMonitorVideo() {
    const video = document.querySelector('video');
    if (video) {
      console.log('找到视频元素，开始监控');
      video.addEventListener('ended', handleVideoEnded);
    } else {
      setupCourseItemMonitoring();
    }
  }
  
  function handleVideoEnded() {
    if (enabled) {
      console.log('视频播放结束，准备切换到下一个');
      setTimeout(clickNextButton, delayTime);
    }
  }
  
  function clickNextButton() {
    console.log('尝试点击下一个按钮');
    
    const nextButtons = [
      '.next-button',
      '.btn-next',
      '.next',
      'button:contains("下一题")',
      'button:contains("下一个")',
      'button:contains("Next")',
      'button:contains("Next question")',
      'a:contains("下一题")',
      'a:contains("下一个")',
      'a:contains("Next")',
      'a:contains("Next question")'
    ];
    
    for (const selector of nextButtons) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          if (element.offsetParent !== null) {
            element.click();
            console.log('成功点击下一个按钮:', selector);
            return true;
          }
        }
      } catch (e) {
        console.log('尝试选择器失败:', selector, e);
      }
    }
    
    const allButtons = document.querySelectorAll('button, a');
    for (const element of allButtons) {
      const text = element.textContent || element.innerText;
      if (text && (text.includes('下一题') || text.includes('下一个') || text.includes('Next') || text.includes('Next question'))) {
        if (element.offsetParent !== null) {
          element.click();
          console.log('通过文本找到并点击下一个按钮');
          return true;
        }
      }
    }
    
    console.log('未找到下一个按钮，尝试点击下一个课程项');
    clickNextCourseItem();
    return false;
  }
  
  function clickNextCourseItem() {
    const courseItems = document.querySelectorAll('.catalogue-item, .course-item, .video-item');
    if (courseItems.length > 0) {
      let currentIndex = -1;
      for (let i = 0; i < courseItems.length; i++) {
        if (courseItems[i].classList.contains('active') || 
            courseItems[i].getAttribute('data-active') === 'true') {
          currentIndex = i;
          break;
        }
      }
      
      const nextIndex = currentIndex + 1;
      if (nextIndex < courseItems.length) {
        courseItems[nextIndex].click();
        console.log('点击下一个课程项');
        return true;
      } else {
        console.log('已经是最后一个课程项');
      }
    }
    
    return false;
  }
  
  function setupCourseItemMonitoring() {
    const courseItems = document.querySelectorAll('.catalogue-item, .course-item, .video-item');
    if (courseItems.length > 0) {
      console.log('找到课程项，设置点击监控');
      
      courseItems.forEach(item => {
        item.addEventListener('click', function() {
          setTimeout(() => {
            findAndMonitorVideo();
          }, 2000);
        });
      });
    }
  }
})();
