
let crsf = "";

window.onload = () => {
  const scriptTags = document.querySelectorAll('script');

  // Parcourir les balises pour trouver celle qui contient "Ignite.postInit"
  scriptTags.forEach(script => {
    const scriptContent = script.textContent || script.innerHTML;
    if (scriptContent.includes('Ignite.postInit')) {

      // Extraire les paramètres passés à Ignite.postInit
      const regex = /Ignite\.postInit\(([^)]+)\)/;
      const match = scriptContent.match(regex);
      if (match && match[1]) {
        const params = match[1].split(',').map(param => param.trim().replace(/['"]+/g, ''));
        // console.log('Paramètres Ignite.postInit:', params);
        crsf = params[2];
      }
    }
  });
};

function groupBy(items, accessor) {
  return items.reduce(function (rv, x) {
    (rv[accessor(x)] = rv[accessor(x)] || []).push(x);
    return rv;
  }, {});
};

function enrichTable(tasks, contacts, companies) {
  console.log(contacts);
  console.log(companies);

  let dealNameIndex = -1;
  let contactNameIndex = -1;
  let accountNameIndex = -1;

  const headerRows = document.querySelectorAll("lyte-thead lyte-tr");
  const headerRow = headerRows[0];

  const headerCells = headerRow.querySelectorAll("lyte-th");

  if (headerCells.length == 0) return;

  for (let j = 0; j < headerCells.length; j++) {
    const cell = headerCells[j];

    if (cell.classList.contains("lv-Deal_Name")) {
      dealNameIndex = j;

      const taskCell = cell.cloneNode(true);
      const taskLabel = taskCell.querySelector('.col-header-text .ellipsis')

      if (taskLabel) {
        taskLabel.textContent = "Tâche";
      }

      taskCell.style.width = "150px";

      headerRow.insertBefore(taskCell, cell);
    }
    else if (cell.classList.contains("lv-Contact_Name")) {
      contactNameIndex = j;

      const titleCell = cell.cloneNode(true);
      const titleLabel = titleCell.querySelector('.col-header-text .ellipsis')

      if (titleLabel) {
        titleLabel.textContent = "Titre du Contact";
      }

      titleCell.style.minWidth = "250px";

      const actualTitleCell = headerRow.insertBefore(titleCell, cell.nextSibling);

      const phoneCell = cell.cloneNode(true);
      const phoneLabel = phoneCell.querySelector('.col-header-text .ellipsis')

      if (phoneLabel) {
        phoneLabel.textContent = "Téléphones du Contact";
      }

      headerRow.insertBefore(phoneCell, actualTitleCell.nextSibling);
    }
    else if (cell.classList.contains("lv-Account_Name")) {
      accountNameIndex = j;

      const companyPhoneCell = cell.cloneNode(true);
      const companyPhoneLabel = companyPhoneCell.querySelector('.col-header-text .ellipsis')

      if (companyPhoneLabel) {
        companyPhoneLabel.textContent = "Téléphone du standard";
      }

      const actualPhoneCell = headerRow.insertBefore(companyPhoneCell, cell.nextSibling);

      const companyDescriptionCell = cell.cloneNode(true);
      const companyDescriptionLabel = companyDescriptionCell.querySelector('.col-header-text .ellipsis')

      if (companyDescriptionLabel) {
        companyDescriptionLabel.textContent = "Description de l'entreprise";
      }

      headerRow.insertBefore(companyDescriptionCell, actualPhoneCell.nextSibling);
    }
  }

  const bodyRows = document.querySelectorAll("lyte-tbody lyte-tr");

  for (let i = 0; i < bodyRows.length; i++) {
    const bodyRow = bodyRows[i];
    const bodyCells = bodyRow.querySelectorAll("lyte-td");

    if (bodyCells.length == 0) return;

    for (let j = 0; j < bodyCells.length; j++) {
      const cell = bodyCells[j];

      if (j == dealNameIndex) {
        const taskCell = cell.cloneNode(true);
        const taskLabel = taskCell.querySelector('span.ellipsis')
        const dealId = cell.querySelector('a').getAttribute('href').split('/')[2]

        if (taskLabel) {
          const dealTasks = tasks[dealId];
          if (dealTasks && dealTasks.length > 0) {
            taskLabel.textContent = dealTasks.map(t => t.Subject).join(', ');
          }
          else {
            taskLabel.textContent = "";
          }
        }

        taskCell.classList.add('lv-Tasks');
        taskCell.style.width = "100px";

        bodyRow.insertBefore(taskCell, cell);
      }
      else if (j == contactNameIndex) {
        const contactTitleCell = cell.cloneNode(true);
        const contactTitleLabel = contactTitleCell.querySelector('span.ellipsis')
        const contactId = contactTitleCell.querySelector('a').getAttribute('href').split('/')[2]

        if (contactTitleLabel) {
          contactTitleLabel.textContent = contacts[contactId].Title;
        }

        const actualContactTitleCell = bodyRow.insertBefore(contactTitleCell, cell.nextSibling);

        const contactPhoneCell = cell.cloneNode(true);
        const contactPhoneLabel = contactPhoneCell.querySelector('span.ellipsis')

        if (contactPhoneLabel) {
          contactPhoneLabel.textContent = [contacts[contactId].Phone, contacts[contactId].Mobile]
            .filter(a => !!a)
            .map(t => !t.includes(" ") && t.match(/.{1,2}/g) ? t.match(/.{1,2}/g).join(' ') : t)
            .join(' / ');
        }

        contactPhoneCell.classList.add('lv-Contact_Phones');

        bodyRow.insertBefore(contactPhoneCell, actualContactTitleCell.nextSibling);
      }
      else if (j == accountNameIndex) {
        const accountPhoneCell = cell.cloneNode(true);
        const accountPhoneLabel = accountPhoneCell.querySelector('span.ellipsis')
        const companyId = accountPhoneCell.querySelector('a').getAttribute('href').split('/')[2]

        if (accountPhoneLabel) {
          const phone = companies[companyId].Phone || "";
          accountPhoneLabel.textContent = !phone.includes(" ") && phone.match(/.{1,2}/g) ? phone.match(/.{1,2}/g).join(' ') : phone;
        }

        accountPhoneCell.classList.add('lv-Account_Phones');

        const actualAccountPhoneCell = bodyRow.insertBefore(accountPhoneCell, cell.nextSibling);

        const accountDescriptionCell = cell.cloneNode(true);
        const accountDescriptionLabel = accountDescriptionCell.querySelector('span.ellipsis')

        if (accountDescriptionLabel) {
          accountDescriptionLabel.textContent = companies[companyId].Description || "";
        }

        accountDescriptionCell.classList.add('lv-Account_Description');

        bodyRow.insertBefore(accountDescriptionCell, actualAccountPhoneCell.nextSibling);
      }
    }
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.action === "enrich-table") {

    const contactIds = [...document.querySelectorAll('lyte-tbody lyte-tr a[href*="contact"')]
      .map(contact => {
        const contactId = contact.getAttribute('href').split('/')[2];
        return contactId;
      });

    const companyIds = [...document.querySelectorAll('lyte-tbody lyte-tr a[href*="companies"')]
      .map(account => {
        const companyId = account.getAttribute('href').split('/')[2];
        return companyId;
      });

    const dealIds = [...document.querySelectorAll('lyte-tbody lyte-tr a[href*="deals"')]
      .map(deal => {
        const dealId = deal.getAttribute('href').split('/')[2];
        return dealId;
      });

    const promises = [
      fetch("https://bigin.zoho.eu/crm/v2/coql", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          "X-Zcsrf-Token": `crmcsrfparam=${crsf}`,
        },
        body: JSON.stringify({
          "select_query": `SELECT Full_Name, Phone, Mobile, Title FROM Contacts WHERE id in (${contactIds.map(c => `'${c}'`).join()})`
        })
      }).then(response => {
        return response.json()
      }),
      fetch("https://bigin.zoho.eu/crm/v2/coql", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          "X-Zcsrf-Token": `crmcsrfparam=${crsf}`,
        },
        body: JSON.stringify({
          "select_query": `SELECT Phone, Description FROM Accounts WHERE id in (${companyIds.map(c => `'${c}'`).join()})`
        })
      }).then(response => {
        return response.json()
      }),
      fetch("https://bigin.zoho.eu/crm/v2/coql", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          "X-Zcsrf-Token": `crmcsrfparam=${crsf}`,
        },
        body: JSON.stringify({
          "select_query": `SELECT Subject, What_Id FROM Tasks WHERE What_Id in (${dealIds.map(c => `'${c}'`).join()}) AND Status = 'En cours'`
        })
      }).then(response => {
        return response.json()
      })
    ];

    Promise.all(promises).then(data => {
      const contacts = Object.fromEntries(data[0].data.map(x => [x.id, x]));
      const companies = Object.fromEntries(data[1].data.map(x => [x.id, x]));
      const tasks = groupBy(data[2].data, x => x.What_Id.id);

      enrichTable(tasks, contacts, companies);
    });
  }
});