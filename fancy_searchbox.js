removeCustomFilterInputIfExists();
setUpCustomFilterInput();
let GLOBALS = { nextEnterKeyUpDisabled: false }; // Prevent accidental log ins, see addTagToVisibleAccounts()

const LOCAL_STORAGE_KEY = "ff-aps-tags";
createTagsContainers();
createAddTagButton();
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
    getAllOptions().forEach(show); // Reset
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
    document.getElementById("saml_form").getElementsByTagName("p")[0].after(inputContainer);
    
    input.focus();
    return input;
}

function detectChanges(event) {
    if (event.which == 13) { // Handle enter key
        if (GLOBALS.nextEnterKeyUpDisabled) { GLOBALS.nextEnterKeyUpDisabled = false; return false; }
        if (this == 'down') { GLOBALS.nextEnterKeyUpDisabled = false; } // Reset on key down
        try { attemptLogin(); } catch(err) { console.error(err); };
        return false;
    }

    // Only register arrow keys on keydown for repeats; this handles highlighting
    if (this == 'down' && detectArrows(event)) { return; }
    if (this == 'up' && (event.which == 38 || event.which == 40)) { return; } // Ignore key up arrows

    // Handle filtering on every other key press
    const filterValue = event.target.value;
    if (filterValue.length == 0) { getAllOptions().forEach(show); resetHighlighted(); return; }

    filterOptionsByValue(filterValue);
}

function hide(o) { parent(o).style.display = 'none'; }
function show(o) { parent(o).style.display = 'block'; }
function parent(o) { return o.parentNode.parentNode; }

function getAllOptions() {
    return [...document.getElementsByClassName("saml-account-name")];
}

function filterOptionsByValue(value) {
    getAllOptions().filter(o => !matchesAllWords(o, value)).forEach(hide);
    getAllOptions().filter(o => matchesAllWords(o, value)).forEach(show);

    resetHighlighted();

    if (getAllOptions().filter(o => matchesAllWords(o, value)).length == 1) {
        // Auto-select
        selectNextVisibleOne(-1);
    }
}

function matchesAllWords(accountName, filterValuesSeparatedBySpaces) {
    const vals = filterValuesSeparatedBySpaces.split(' ').filter(val => val.slice(0, 1) != "."); // Ignore any tag-specific filters
    const accountTextAndTags = accountName.innerText + " " + accountName.dataset.tags;
    const allValuesFoundInAccountTextOrTags = vals.every(o => accountTextAndTags.indexOf(o) != -1);
    return allValuesFoundInAccountTextOrTags;
}

function attemptLogin() {
    const visibleOptions = getAllVisibleOptionsParents();

    // Detect if there is an option selected (highlighted)
    let options = getAllVisibleOptionsParents();
    let selected = getHighlightedIndex(options);

    if (selected !== -1) {
        if (!doubleConfirmationIfProd(options[selected].innerText)) { return; }
        options[selected].getElementsByClassName('saml-role-description')[0].click();
        clickLoginButton();
    } else
    
    // None highlighted? If there is only 1, select that one
    if (visibleOptions.length == 1) {
        if (!doubleConfirmationIfProd(visibleOptions[0].innerText)) { return; }
        visibleOptions[0].getElementsByClassName('saml-role-description')[0].click();
        clickLoginButton();
    }

    // None at all? We done here.
}

function getAllVisibleOptionsParents() {
    return getAllOptions().map(parent).filter(o => o.style.display != 'none');
}

function doubleConfirmationIfProd(ele) {
    const prodValues = ["prd", "prod", "pool"];
    const text = ele;
    console.log(ele.toLowerCase());
    if (!prodValues.some(prodVal => text.toLowerCase().indexOf(prodVal) != -1)) { return true; }

    let confirmation = confirm("WARNING: THIS MAY BE A PRODUCTION ENVIRONMENT!\n\nAre you sure you want to continue?");
    // confirmation = confirmation ? confirm("Are you really, REALLY sure though?") : confirmation;
    return confirmation;
}

function clickLoginButton() { document.getElementById("signin_button").click(); }


//
// Highlighting functionality
//
function resetHighlighted() {
    window.scrollTo(0, 0);
    getAllVisibleOptionsParents().forEach(o => o.style.borderLeft = "none");
}

function detectArrows(event) {
    if (event.which == 27) { resetHighlighted(); return true; } // Escape key

    if (event.which == 38 || event.which == 40) { // Handle up (38) or down (40) keys for easy selection
        handleArrow(event.which);
        return true;
    }

    resetHighlighted();
}

function handleArrow(arrkey) {
    const direction = arrkey == 38 ? -1 : 1;
    selectNextVisibleOne(direction);
}

const HIGHLIGHT_COLOR = "3px solid rgb(255, 153, 0)";

function selectNextVisibleOne(direction) {
    let options = getAllVisibleOptionsParents();
    let selected = getHighlightedIndex(options);
    selected += direction;
    selected = Math.min(selected, options.length - 1); // Make sure it's at least the first one
    selected = Math.max(selected, 0);                  // Make sure it's at most the last one

    resetHighlighted();

    options[selected].style.borderLeft = HIGHLIGHT_COLOR;
    scrollToMakeItVisible(options[selected]);
}

function getHighlightedIndex(options) {   
    for (let i = 0; i < options.length; i++) {
        if (options[i].style.borderLeft == HIGHLIGHT_COLOR) { return i; }
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
    
    const lastElementsInEachAccount = [...document.getElementsByClassName("saml-account")].filter(ele => ele.parentNode.tagName == 'DIV');
    lastElementsInEachAccount.forEach(ele => createTagsContainer(ele));
}

function createTagsContainer(ele) {
    const tagsLabel = document.createElement("div");
    tagsLabel.style.margin = "0 20px";
    tagsLabel.setAttribute("class", "custom-tags");
    ele.append(tagsLabel);
}

function createAddTagButton() {
    const button = document.createElement("button");
    button.innerText = "Add Tag";
    button.style.margin = "0 0 0 .75em";
    button.style.padding = ".5em 1em";
    button.setAttribute("class", "add-tag-button");
    
    const filterInput = document.getElementsByClassName("custom-filter")[0];
    filterInput.after(button);

    button.onclick = addTagToVisibleAccounts;
}

function addTagToVisibleAccounts() {
    document.getElementsByClassName("custom-filter")[0].focus();
    GLOBALS.nextEnterKeyUpDisabled = true; // Prevent issue where hitting enter key may register as a keyup in filter causing an accidental log in; won't prevent key repeats though

    let tag = prompt("Please provide a tag name (a-z 0-9 - . ! no spaces, >=2) to add:");
    tag = tag == null ? null : tag.toLowerCase();
    if (tag == null) { return false; }
    if (!isValidTagName(tag)) { alert("Invalid tag name, must adhere to (a-z 0-9 - . ! no spaces, >=2)"); return false; }
    
    let visibleAccounts = getAllVisibleOptionsParents();
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
        return JSON.parse(tags);
    } catch (err) {
        console.error(`Error while attempting to load tags: ${err}`);
    }

    return  {};
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