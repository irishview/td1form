function toNum(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }


function recalcTotal() {
const ids = ['line1','line2','line3','line4','line5','line6','line7','line8','line9','line10','line11','line12'];
const total = ids.reduce((s,id)=> s + toNum(document.getElementById(id)?.value), 0);
document.getElementById('line13').value = total.toFixed(2);
}


function setupCalc() {
const ids = ['line1','line2','line3','line4','line5','line6','line7','line8','line9','line10','line11','line12'];
ids.forEach(id=> document.getElementById(id)?.addEventListener('input', recalcTotal));
recalcTotal();
}


function setupNonResident() {
const radios = document.querySelectorAll('input[name="nonresident_90"]');
const l2to12 = document.getElementById('lines2to12');
function update() {
const val = document.querySelector('input[name="nonresident_90"]:checked')?.value;
if (val === 'no') {
// CRA instruction: enter 0 on line 13 and do not fill lines 2–12
document.getElementById('line13').value = '0.00';
l2to12.querySelectorAll('input[type="number"]').forEach(el=> el.disabled = true);
} else {
l2to12.querySelectorAll('input[type="number"]').forEach(el=> el.disabled = false);
recalcTotal();
}
}
radios.forEach(r=> r.addEventListener('change', update));
update();
}


function calcNorthernDeduction() {
const days11 = toNum(document.getElementById('northern_days_11')?.value);
const days22 = toNum(document.getElementById('northern_days_22')?.value);
let amount = days11 * 11 + days22 * 22;
if (document.getElementById('intermediate_zone')?.checked) amount *= 0.5;
document.getElementById('northern_calc').textContent = amount.toFixed(2);
}


function setupNorthern() {
['northern_days_11','northern_days_22','intermediate_zone'].forEach(id=>
document.getElementById(id)?.addEventListener('input', calcNorthernDeduction)
);
calcNorthernDeduction();
}


function handleSubmit(e) {
e.preventDefault();
const form = e.target;
const data = Object.fromEntries(new FormData(form).entries());


if (!form.certify.checked) {
alert('You must certify the information before signing.');
return;
}


fetch('/submit', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(data)
}).then(r=>r.json()).then(j=>{
if (!j.ok) throw new Error(j.error || 'Submission failed');
alert('Submitted! Timestamp: ' + j.timestamp);
form.reset();
recalcTotal();
calcNorthernDeduction();
}).catch(err=>{
alert('Error: ' + err.message);
});
}


window.addEventListener('DOMContentLoaded', () => {
setupCalc();
setupNonResident();
setupNorthern();
document.getElementById('td1form').addEventListener('submit', handleSubmit);
});