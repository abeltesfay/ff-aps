removeCustomFilterInputIfExists();
setUpCustomFilterInput();
setUpSingleClickLogin();
let GLOBALS = { nextEnterKeyUpDisabled: false }; // Prevent accidental log ins, see addTagToVisibleAccounts()

const LOCAL_STORAGE_KEY = "ff-aps-tags";
let prodNavigationConfirmed = undefined;
createTagsContainers();
createTagButtons();
resetTagsFromMemory();


document.body.onkeydown = refocusInputOnEscapeKey;

//
// Allow user to hit escape key if focus is lost from input filter
//
function refocusInputOnEscapeKey(event) {
    if (event.which != 27) { return; }
    document.getElementsByClassName("custom-filter")[0].focus();
    resetHighlighted();
    return false;
};

//
// Creating a new input to filter when typing
//
function removeCustomFilterInputIfExists() {
    // https://stackoverflow.com/questions/3871547/js-iterating-over-result-of-getelementsbyclassname-using-array-foreach
    [...document.getElementsByClassName("custom-filter-container")].forEach(o => o.remove());
}

function setUpCustomFilterInput() {
    getAllOptions().forEach(showRole); // Reset
    resetHighlighted();

    // Create custom filter
    const inputContainer = document.createElement("div");
    inputContainer.setAttribute("class", "custom-filter-container");
    inputContainer.style.padding = "0 0 1em 20px";
    inputContainer.style.display = "flex";

    const input = document.createElement("input");
    input.setAttribute("class", "custom-filter");
    input.setAttribute("autocomplete", "off");
    input.style.boxSizing = "border-box";
    input.style.flexGrow = "1";
    input.style.padding = "5px";
    // input.style.width = "100%";
    input.onkeydown = detectChanges.bind('down'); // bind 'this' keyword = 'down' when inside the function 
    input.onkeyup = detectChanges.bind('up');
    input.placeholder = "Space-delimited filter, .tag, arrow keys select, enter logs in, escape to re-focus here";

    inputContainer.appendChild(input);
    
    // Append search box to form
    document.getElementById("saml_form")?.getElementsByTagName("p")[0].after(inputContainer);
    
    input.focus();
    return input;
}

function setUpSingleClickLogin() {
    getAllOptionRadios().forEach(option => {
        option.parentNode.addEventListener("click", logInSingleClick.bind(option));
    });
}

function logInSingleClick() {
    if (!doubleConfirmationIfProd(getAccountNameFromRadio(this))) { return; }
    this.parentNode.getElementsByTagName("input")[0].click();
    clickLoginButton();
}

function getAllOptionRadios() {
    return [...document.getElementsByClassName("saml-role-description")];
}

function getAccountNameFromRadio(radio) {
    return radio.parentNode.parentNode.parentNode.getElementsByClassName("saml-account-name")[0].innerText;
}

function detectChanges(event) {
    if (event.which == 13) { // Handle enter key
        if (GLOBALS.nextEnterKeyUpDisabled) { GLOBALS.nextEnterKeyUpDisabled = false; return false; }
        if (this == 'down') { GLOBALS.nextEnterKeyUpDisabled = false; } // Reset on key down
        try { attemptLogin(); } catch(err) { console.error(err); };
        return false;
    }
    
    if (event.which == 17) { event.preventDefault(); return; } // Ignore control key so that it doesn't reset highlighting

    // Only register arrow keys on keydown for repeats; this handles highlighting
    if (this == 'down' && detectArrows(event)) { event.preventDefault(); return; }
    if (this == 'up' && (event.which == 38 || event.which == 40)) { return; } // Ignore key up arrows

    // Handle filtering on every other key press
    const filterValue = event.target.value;
    if (filterValue.length == 0) { getAllOptions().forEach(showRole); resetHighlighted(); return; }

    filterOptionsByValue(filterValue);
}

function hideRole(o) { o.ele.style.display = "none"; hideOrShowAccountsIfNoRolesVisible(); }
function showRole(o) { o.ele.style.display = "block"; hideOrShowAccountsIfNoRolesVisible(); }

function hideOrShowAccountsIfNoRolesVisible() {
    const options = getAllOptions();
    options.forEach(option => {
        const currentAccountEle = option.accountLabelEle;
        const selectableRoles = options.filter(o => o.accountLabelEle == currentAccountEle);
        const hasVisibleRoles = selectableRoles.some(selectableRole => selectableRole.ele.style.display === "block");
           
        parent(currentAccountEle).style.display = hasVisibleRoles ? "block" : "none";
    })
};

function parent(o) { return o.parentNode.parentNode; }
function parentWrap(option) { return option.accountLabelEle.parentNode.parentNode; }

function getAllOptions() {
    const roleEles = [...document.getElementsByClassName("saml-role")];
    return roleEles.map(ele => ({
        accountLabelEle: ele.parentElement.parentElement.getElementsByClassName("saml-account-name")[0],
        ele,
    }));
}

function filterOptionsByValue(value) {
    getAllOptions().filter(o => !matchesAllWords(o, value)).forEach(hideRole);
    getAllOptions().filter(o => matchesAllWords(o, value)).forEach(showRole);
    hideOrShowAccountsIfNoRolesVisible(getAllOptions());

    resetHighlighted();

    if (getAllOptions().filter(o => matchesAllWords(o, value)).length == 1) {
        // Auto-select
        selectNextVisibleOne(-1);
    }
}

function matchesAllWords(accountName, filterValuesSeparatedBySpaces) {
    const vals = filterValuesSeparatedBySpaces.split(' ').filter(val => val.slice(0, 1) != "."); // Ignore any tag-specific filters
    const accountTextAndRoleAndTags = accountName.accountLabelEle.innerText + " " + accountName.ele.innerText + " " + accountName.accountLabelEle.dataset.tags;
    const allValuesFoundInAccountTextOrRoleOrTags = vals.every(o => accountTextAndRoleAndTags.indexOf(o) != -1);
    return allValuesFoundInAccountTextOrRoleOrTags;
}

function attemptLogin() {
    const visibleOptions = getAllVisibleOptionsParents();

    // Detect if there is an option selected (highlighted)
    let options = getAllVisibleOptionsParents();
    let selected = getHighlightedIndex(options);

    if (selected !== -1) {
        if (!doubleConfirmationIfProd(parentWrap(options[selected]).innerText)) { return; }
        options[selected].ele.click();
        clickLoginButton();
    } else
    
    // None highlighted? If there is only 1, select that one
    if (visibleOptions.length == 1) {
        if (!doubleConfirmationIfProd(parentWrap(visibleOptions[0]).innerText)) { return; }
        visibleOptions[0].ele.click();
        clickLoginButton();
    }

    // None at all? We done here.
}

function getAllVisibleOptionsParents() {
    return getAllOptions().filter(option => {
        const container = parent(option.accountLabelEle);
        return container.style.display != 'none';
    });
}

function doubleConfirmationIfProd(ele) {
    const prodValues = ["prd", "prod", "pool"];
    const text = ele;
    console.log(ele.toLowerCase());
    if (!prodValues.some(prodVal => text.toLowerCase().indexOf(prodVal) != -1)) { return true; }

    prodNavigationConfirmed = prodNavigationConfirmed || typeof prodNavigationConfirmed === "undefined" && confirm("WARNING: THIS MAY BE A PRODUCTION ENVIRONMENT!\n\nAre you sure you want to continue?");
    // confirmation = confirmation ? confirm("Are you really, REALLY sure though?") : confirmation;

    // Prevent double confirmations that are happening
    // prodNavigationConfirmed = confirmation;
    
    // Reset
    setTimeout(() => { prodNavigationConfirmed = undefined; }, 150);
    
    return prodNavigationConfirmed;
}

function clickLoginButton() { document.getElementById("signin_button").click(); }


//
// Highlighting functionality
//
function resetHighlighted() {
    window.scrollTo(0, 0);
    getAllVisibleOptionsParents().forEach(o => {
        o.ele.style.borderLeft = "none";
        parentWrap(o).style.borderLeft = "none";
    });
}

function detectArrows(event) {
    if (event.which == 27) { resetHighlighted(); return true; } // Escape key

    if (event.which == 38 || event.which == 40) { // Handle up (38) or down (40) keys for easy selection
        handleArrow(event.which, event.getModifierState("Control"));
        return true;
    }

    resetHighlighted();
}

function handleArrow(arrkey, isControlActive) {
    const direction = arrkey == 38 ? -1 : 1;
    selectNextVisibleOne(direction, isControlActive);
}

const HIGHLIGHT_COLOR = "3px solid rgb(255, 153, 0)";

function selectNextVisibleOne(direction, gotoNextAccount) {
    let options = getAllVisibleOptionsParents();
    let selected = getHighlightedIndex(options);

    selected += getBigJumpOffset(gotoNextAccount, options, selected, direction);
    selected = Math.min(selected, options.length - 1); // Make sure it's at least the first one
    selected = Math.max(selected, 0);                  // Make sure it's at most the last one

    resetHighlighted();

    parentWrap(options[selected]).style.borderLeft = HIGHLIGHT_COLOR;
    options[selected].ele.style.borderLeft = HIGHLIGHT_COLOR;
    scrollToMakeItVisible(parentWrap(options[selected]));
}

function getBigJumpOffset(gotoNextAccount, options, selectedIndex = 0, direction) {
    if (!gotoNextAccount) { return direction; } // No big jump, just single role jump
    
    const selectedAccount = options[selectedIndex]?.accountLabelEle?.innerText;
    let multiplier = 0, nextIndex, nextAccount = selectedAccount;
    
    do {
        multiplier++;
        nextIndex = selectedIndex + (direction * multiplier);
        nextAccount = options[nextIndex]?.accountLabelEle?.innerText
    } while (nextAccount?.length > 0 && nextIndex > 0 && nextIndex < options.length && nextAccount == selectedAccount);
    
    return multiplier * direction;
}

function getHighlightedIndex(options) {   
    for (let i = 0; i < options.length; i++) {
        if (options[i].ele.style.borderLeft == HIGHLIGHT_COLOR) { return i; }
    }

    return -1;
}

function scrollToMakeItVisible(ele) {
    for(let i = 0; i < window.scrollMaxY; i++) {
        window.scrollTo(0, i);
        if (isScrolledIntoView(ele)) { return; }
    }
}

// https://stackoverflow.com/questions/487073/how-to-check-if-element-is-visible-after-scrolling
function isScrolledIntoView(el) {
    const buffer = 60; // add 60 pixels of buffer for scrollbar
    var rect = el.getBoundingClientRect();
    var elemTop = rect.top;
    var elemBottom = rect.bottom + buffer;
    // console.log(elemTop + " - " + elemBottom);

    // Only completely visible elements return true:
    var isVisible = (elemTop >= 0) && (elemBottom <= window.innerHeight);
    // Partially visible elements return true:
    // isVisible = elemTop < window.innerHeight && elemBottom >= 0;
    return isVisible;
}

//
// Tag functionality
//
//
// Tagging functionality to allow for related project/functionality grouping and easier filtering
//
function createTagsContainers() {
    [...document.getElementsByClassName("custom-tags")].forEach(ele => ele.remove()); // Remove any old tags div containers
    
    [...document.getElementsByClassName("saml-role")].forEach(ele => ele.style.marginBottom = "10px"); // Styling tweak to fit tags closer to roles

    const lastElementsInEachAccount = [...document.getElementsByClassName("saml-account")].filter(ele => ele.parentNode.tagName == 'DIV');
    lastElementsInEachAccount.forEach(ele => createTagsContainer(ele));
}

function createTagsContainer(ele) {
    const tagsLabel = document.createElement("div");
    tagsLabel.style.margin = "0 20px";
    tagsLabel.setAttribute("class", "custom-tags");
    ele.append(tagsLabel);
}

function createTagButtons() {
    createTagButtonElement("Tag", addTagToVisibleAccounts, "Add tag to currently visible accounts");
    let buttonE = createTagButtonElement("E", exportTags, "Export tags; display importable string that you can share");
    let buttonI = createTagButtonElement("I", importTags, "Import tags; replace your current tags with values from json string");

    buttonE.style.padding = ".5em .5em";
    buttonI.style.padding = ".5em .5em";
}

function createTagButtonElement(text, func, title) {
    const button = document.createElement("button");
    button.innerText = text;
    button.style.margin = "0 0 0 .5em";
    button.style.padding = ".5em 1em";
    button.setAttribute("title", title);
    button.setAttribute("class", "add-tag-button");
    button.onclick = func;

    const filterContainer = document.getElementsByClassName("custom-filter-container")[0];
    filterContainer?.appendChild(button);

    return button;
}

function addTagToVisibleAccounts() {
    document.getElementsByClassName("custom-filter")[0].focus();
    GLOBALS.nextEnterKeyUpDisabled = true; // Prevent issue where hitting enter key may register as a keyup in filter causing an accidental log in; won't prevent key repeats though

    let tag = prompt("Please provide a tag name (a-z 0-9 - . ! no spaces, >=2) to add:");
    tag = tag == null ? null : tag.toLowerCase();
    if (tag == null) { return false; }
    if (!isValidTagName(tag)) { alert("Invalid tag name, must adhere to (a-z 0-9 - . ! no spaces, >=2)"); return false; }
    
    let visibleAccounts = getAllVisibleOptionsParents();
    visibleAccounts = Array.from(new Set(visibleAccounts.map(account => account.accountLabelEle)));
    if (visibleAccounts.length > 4
        && !confirm(`Are you sure you want to tag all ${visibleAccounts.length} accounts with '${tag}'?`)) { return false; }
    visibleAccounts.forEach(account => addTagToAccount(account, tag));

    resetTagsFromMemory();
    return false; // Prevent form submission
}

function isValidTagName(str) {
    return typeof str === "string" && /^([a-z0-9\-\.\!]{2,})$/.test(str);
}

function addTagToAccount(accountElement, tag) {
    const accountNameText = accountElement.getElementsByClassName("saml-account-name")[0].innerText;
    const accountNumber = accountNameText.slice(accountNameText.indexOf("(") + 1, -1);

    let updatedAccountTags = JSON.parse(JSON.stringify(loadAccountTags(accountNumber)));
    updatedAccountTags.push(tag);

    saveAccountTags(accountNumber, updatedAccountTags);
}

function resetTagsFromMemory() {
    const customTags = [...document.getElementsByClassName("custom-tags")];
    customTags.forEach(ele => fillCustomTag(ele));
}

function fillCustomTag(customTagsContainer) {
    customTagsContainer.innerHTML = ""; // Clear current tag labels
    const accountNameText = customTagsContainer.parentNode.parentNode.getElementsByClassName("saml-account-name")[0].innerText;
    const accountNumber = accountNameText.slice(accountNameText.indexOf("(") + 1, -1);
    const tagLabelsToCreate = loadAccountTags(accountNumber);
    addTagsToSamlAccountNameDataSet(customTagsContainer, tagLabelsToCreate.join(" "));
    tagLabelsToCreate.forEach(tag => addTagElement(customTagsContainer, accountNumber, tag));
}

function addTagsToSamlAccountNameDataSet(customTagsContainer, tags) {
    customTagsContainer.parentNode.parentNode.getElementsByClassName("saml-account-name")[0].dataset.tags = tags;
}

// Returns an array of string tags for the specified account number
function loadAccountTags(accountNumber) {
    let tags = loadAllTags()?.[accountNumber];
    return !Array.isArray(tags) ? [] : tags;
}

// Returns a map of "accountNumber" -> ["tag1","tag2",...,"tagX"]
function loadAllTags() {
    try {
        let tags = window.localStorage.getItem(LOCAL_STORAGE_KEY); // https://www.lastweekinaws.com/blog/are-aws-account-ids-sensitive-information/
        return tags == null ? {} : JSON.parse(tags);
    } catch (err) {
        console.error(`Error while attempting to load tags: ${err}`);
    }

    return {};
}

function addTagElement(customTag, accountNumber, tag) {
    let tagSpan = document.createElement("span"); // wrapper for below label+delete button
    tagSpan.style.backgroundColor = "#ddd";
    tagSpan.style.borderRadius = "3px";
    tagSpan.style.display = "inline-block";
    tagSpan.style.lineHeight = "1em";
    tagSpan.style.marginRight = ".5em";
    tagSpan.style.userSelect = "none";
    
    let label = document.createElement("label");
    label.setAttribute("class", "custom-tag-label");
    label.innerText = tag;
    label.style.borderRadius = "3px";
    label.style.display = "inline-block";
    label.style.padding = ".25em .5em";
    label.onclick = appendTagToFilter.bind(label.innerText);
    
    let delbutton = document.createElement("label");
    delbutton.innerText = "×";
    delbutton.style.backgroundColor = "#eee";
    delbutton.style.borderRadius = "3px";
    delbutton.style.display = "inline-block";
    delbutton.style.borderRadius = "0 3px 3px 0";
    delbutton.style.padding = ".25em .5em";
    delbutton.style.cursor = "pointer";
    delbutton.onclick = deleteTag.bind({accountNumber, tag});
    
    tagSpan.appendChild(label);
    tagSpan.appendChild(delbutton);
    customTag.appendChild(tagSpan);
}

function deleteTag() {
    const { accountNumber, tag: tagToRemove } = this;
    if (!confirm(`Are you sure you want to remove tag '${tagToRemove}' from account ${accountNumber}?`)) { return; }
    
    let updatedAccountTags = JSON.parse(JSON.stringify(loadAccountTags(accountNumber)));
    updatedAccountTags = updatedAccountTags.filter(tagInList => tagInList !== tagToRemove);

    saveAccountTags(accountNumber, updatedAccountTags);
    resetTagsFromMemory();
    refreshFilterView();
}

function saveAccountTags(accountNumber, updatedAccountTags) {
    let allTags = loadAllTags();
    if (typeof allTags != 'object') { allTags = {} };

    allTags[accountNumber] = updatedAccountTags;
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allTags));
}

function appendTagToFilter() {
    const filter = document.getElementsByClassName("custom-filter")[0];
    if (filter.value.indexOf(this) != -1) { return; }
    filter.value = `${filter.value} ${this}`.trim();
    refreshFilterView();
}

function refreshFilterView() {
    const filter = document.getElementsByClassName("custom-filter")[0];
    filterOptionsByValue(filter.value);
    filter.focus();
}

function exportTags() {
    document.getElementsByClassName("custom-filter")[0].focus();
    const tags = loadAllTags();

    const noEmptyTags = Object.getOwnPropertyNames(tags).reduce((prev, curr) => {
                if (tags[curr].length > 0) { prev[curr] = tags[curr]; }
                return prev;
            }
            , {}
        );

    document.getElementsByClassName("custom-filter")[0].value = JSON.stringify(noEmptyTags);
    return false;
}

function importTags() {
    document.getElementsByClassName("custom-filter")[0].focus();
    
    const importableJson = prompt("WARNING: This replaces ALL tags on specified accounts, and leaves tags on unspecified ones! We recommend exporting a backup.\n\nPlease paste the importable json string here:");
    if (importableJson == null) { return false; }

    try {
        const obj = JSON.parse(importableJson);
        const accounts = Object.getOwnPropertyNames(obj);
        const accountsOnPage = getAllOptions().map(ele => ele.innerText).map(accountNameText => accountNameText.slice(accountNameText.indexOf("(") + 1, -1).trim());
        
        const validAccounts = accounts.filter(account => accountsOnPage.indexOf(account) >= 0);
        const invalidAccounts = accounts.filter(account => accountsOnPage.indexOf(account) == -1);
        const totalTagsFound = accounts.reduce((prev, curr) => prev + obj[curr].length, 0);

        const validAccountsAndTags = validAccounts.reduce((prev, curr) => { prev[curr] = obj[curr].filter(isValidTagName); return prev; }, {}); // Filter invalid tags

         // Merge-replace accounts+tags map into current accounts+tags map
        let currentTags = loadAllTags();
        const tagsToSave = validAccounts.reduce((prev, curr) => { prev[curr] = validAccountsAndTags[curr]; return prev; }, currentTags);
        saveAndReplaceAllTags(tagsToSave);

        const totalTagsImported = validAccounts.reduce((prev, curr) => prev + validAccountsAndTags[curr].length, 0);
        const totalTagsSaved = Object.getOwnPropertyNames(tagsToSave).reduce((prev, curr) => prev + tagsToSave[curr].length, 0);

        alert(`${validAccounts.length} valid accounts found:\n`
            + `${validAccounts}\n\n`
            + `${invalidAccounts.length} invalid accounts found:\n`
            + `${invalidAccounts}\n\n`
            + `${totalTagsImported} / ${totalTagsFound} total tags imported, total tags saved ${totalTagsSaved}`);
    } catch(err) {
        alert(err);
    }

    resetTagsFromMemory();
    
    return false;
}

function saveAndReplaceAllTags(tags) {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tags));
}