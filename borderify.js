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
    input.onkeydown = detectChanges;
    input.onkeyup = detectChanges;
    
    // Append to form
    document.getElementById("saml_form").getElementsByTagName("p")[0].after(input);
    
    // Focus
    input.focus();
    return input;
}

const finalInput = setUpInput();
const accts = getAccounts();

function getAccounts() {
    return [...document.getElementsByClassName("saml-account-name")].forEach(o => o.innerText.replace("Account: ", ""));
}

function detectChanges() {
    const filterValue = this.value;
    if (filterValue.length == 0) { getAllOptions().forEach(show); return; }

    filterOptionsByValue(filterValue);
}

function hide(o) { o.parentNode.parentNode.style.display = 'none'; }
function show(o) { o.parentNode.parentNode.style.display = 'block'; }

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
    console.log(allValuesFoundInAccountText);
    return allValuesFoundInAccountText;
}