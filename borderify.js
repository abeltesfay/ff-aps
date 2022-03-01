// Clean up old custom filter inputs that may exist
// https://stackoverflow.com/questions/3871547/js-iterating-over-result-of-getelementsbyclassname-using-array-foreach
[...document.getElementsByClassName("custom-filter")].forEach(o => o.remove());

const ENUM_CHANGETYPE = { KEYDOWN: 0, KEYUP: 1 };

function setUpInput() {
    // Create custom filter
    const input = document.createElement("input");
    input.setAttribute("class", "custom-filter");
    input.style.padding = "5px";
    input.style.margin = "0 20px 1em";
    input.style.width = "100%";
    input.onkeydown = detectChanges; //.bind(ENUM_CHANGETYPE.KEYDOWN);
    input.onkeyup = detectChanges; //.bind(ENUM_CHANGETYPE.KEYUP);
    // input.onchange = detectChanges.bind(ENUM_CHANGETYPE.CHANGE);
    
    // Append to form
    document.getElementById("saml_form").getElementsByTagName("p")[0].after(input);
    
    // Focus
    input.focus();
    return input;
}

function getAccounts() {
    return [...document.getElementsByClassName("saml-account-name")].forEach(o => console.log(o.innerText.replace("Account: ", "")));
}

const finalInput = setUpInput();
const accts = getAccounts();

function detectChanges(event) {
    const filterValue = this.value;
    if (filterValue.length == 0) { getAllOptions().forEach(show); return; }
    
    filterOptionsByValue(filterValue);
}

function getAllOptions() {
    return [...document.getElementsByClassName("saml-account-name")];
}

function filterOptionsByValue(value) {
    // showAllOptions();
    getAllOptions().filter(label => label.innerText.indexOf(value) != -1).forEach(show);
    getAllOptions().filter(label => label.innerText.indexOf(value) == -1).forEach(hide);
}

function hide(o) { o.parentNode.parentNode.style.display = 'none'; }
function show(o) { o.parentNode.parentNode.style.display = 'block'; }