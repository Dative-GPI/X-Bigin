document.addEventListener('DOMContentLoaded', function () {
  
  document.getElementById('enrichTableButton').addEventListener('click', () => {
    // Modification de la page
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "enrich-table" });
    });
  });
});