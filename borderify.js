removeCustomFilterInputIfExists();

setUpCustomFilterInput();

document.body.onkeydown = refocusInputOnEscapeKey;

// Allow user to hit escape key if focus is lost from input filter
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
    [...document.getElementsByClassName("custom-filter")].forEach(o => o.remove());
}

function setUpCustomFilterInput() {
    getAllOptions().forEach(show); // Reset
    resetHighlighted();

    // Create custom filter
    const input = document.createElement("input");
    input.setAttribute("class", "custom-filter");
    input.style.padding = "5px";
    input.style.margin = "0 20px 1em";
    input.style.width = "100%";
    input.onkeydown = detectChanges.bind('down'); // bind 'this' keyword = 'down' when inside the function 
    input.onkeyup = detectChanges.bind('up');
    input.placeholder = "Space-delimited filter, arrow keys to select, hit enter to log in, escape to re-focus here";
    
    // Append search box to form
    document.getElementById("saml_form").getElementsByTagName("p")[0].after(input);
    
    input.focus();
    return input;
}

function detectChanges(event) {
    if (event.which == 13) { // Handle enter key
        attemptLogin();
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
    const vals = filterValuesSeparatedBySpaces.split(' ');
    const accountText = accountName.innerText;
    const allValuesFoundInAccountText = vals.every(o => accountText.indexOf(o) != -1);
    return allValuesFoundInAccountText;
}

function attemptLogin() {
    const visibleOptions = getAllVisibleOptionsParents();

    // Detect if there is an option selected (highlighted)
    let options = getAllVisibleOptionsParents();
    let selected = getHighlightedIndex(options);

    if (selected !== -1) {
        options[selected].getElementsByClassName('saml-role-description')[0].click();
        clickLoginButton();
    } else

    // None highlighted? If there is only 1, select that one
    if (visibleOptions.length == 1) {
        // Select the first radio button
        visibleOptions[0].getElementsByClassName('saml-role-description')[0].click();
        clickLoginButton();
    }

    // None at all? We done here.
}

function getAllVisibleOptionsParents() {
    return getAllOptions().map(parent).filter(o => o.style.display != 'none');
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
// TODO Tag storage per account for easier search
//