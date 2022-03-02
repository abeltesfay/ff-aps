// Clean up old custom filter inputs that may exist
// https://stackoverflow.com/questions/3871547/js-iterating-over-result-of-getelementsbyclassname-using-array-foreach
[...document.getElementsByClassName("custom-filter")].forEach(o => o.remove());

const ENUM_CHANGETYPE = { KEYDOWN: 0, KEYUP: 1 };

function setUpInput() {
    getAllOptions().forEach(show); // Reset
    resetHighlighted();

    // Create custom filter
    const input = document.createElement("input");
    input.setAttribute("class", "custom-filter");
    input.style.padding = "5px";
    input.style.margin = "0 20px 1em";
    input.style.width = "100%";
    input.onkeydown = detectChanges.bind('down');
    input.onkeyup = detectChanges.bind('up');
    
    // Append search box to form
    document.getElementById("saml_form").getElementsByTagName("p")[0].after(input);
    
    input.focus();
    return input;
}

const finalInput = setUpInput();

function detectChanges(event) {
    // if (this !== 'down') { ; }
    if (event.which == 13) { // Handle enter key
        attemptLogin();
        return false;
    }

    if (this == 'down' && detectArrows(event)) { return; } // Exit on arrows


    const filterValue = event.target.value;
    if (filterValue.length == 0) { getAllOptions().forEach(show); return; }

    filterOptionsByValue(filterValue);
}

function hide(o) { parent(o).style.display = 'none'; }
function show(o) { parent(o).style.display = 'block'; }
function parent(o) { return o.parentNode.parentNode; }

function getAllOptions() {
    return [...document.getElementsByClassName("saml-account-name")];
}

function filterOptionsByValue(value) {
    getAllOptions().filter(o => matchesAll(o, value)).forEach(show);
    getAllOptions().filter(o => !matchesAll(o, value)).forEach(hide);
}

function matchesAll(accountName, filterValuesSeparatedBySpaces) {
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
        // Select the radio button
        visibleOptions[0].getElementsByClassName('saml-role-description')[0].click();
        clickLoginButton();
    }

    // None at all? We done here.
}

function getAllVisibleOptionsParents() {
    return getAllOptions().map(parent).filter(o => o.style.display !== 'none');
}

function clickLoginButton() { document.getElementById("signin_button").click(); }


//
// Highlighting functionality
//
function resetHighlighted() {
    getAllVisibleOptionsParents().filter(o => o.style.borderLeft = "none");
}

function detectArrows(event) {
    if (event.which == 27) { resetHighlighted(); return true; }

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

const HIGHLIGHT_COLOR = "2px dashed red";

function selectNextVisibleOne(direction) {
    let options = getAllVisibleOptionsParents();
    let selected = getHighlightedIndex(options);
    selected += direction;
    selected = Math.min(selected, options.length - 1); // Make sure it's at least the first one
    selected = Math.max(selected, 0);                  // Make sure it's at most the last one

    resetHighlighted();

    options[selected].style.borderLeft = HIGHLIGHT_COLOR;
}

function getHighlightedIndex(options) {   
    for (let i = 0; i < options.length; i++) {
        if (options[i].style.borderLeft == HIGHLIGHT_COLOR) { return i; }
    }

    return -1;
}