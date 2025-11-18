// moneypenny.js
// A custom-made spam filter for 616 Strength & Nutrition

// Miss Moneypenny's complete script. Running on the server.
const version = "0.0.0"

// Load emailjs
var emailjs=function(e){"use strict";class t{constructor(e=0,s="Network Error"){this.status=e,this.text=s}}const i={origin:"https://api.emailjs.com",blockHeadless:!1,storageProvider:(()=>{const e=new Map;return{get:t=>Promise.resolve(e.get(t)),set:(t,s)=>Promise.resolve(e.set(t,s)),remove:t=>Promise.resolve(e.delete(t))}})()};const r=e=>e?typeof e=="string"?{publicKey:e}:"[object Object]"===e.toString()?e:{}:{};const o=(e,s="https://api.emailjs.com")=>{if(!e)return;const n=r(e);i.publicKey=n.publicKey,i.blockHeadless=n.blockHeadless,i.storageProvider=n.storageProvider,i.blockList=n.blockList,i.limitRate=n.limitRate,i.origin=n.origin||s};const a=async(e,t,s={})=>{const n=await fetch(i.origin+e,{method:"POST",headers:s,body:t}),o=await n.text(),r=new t(n.status,o);if(n.ok)return r;throw r};const c=async(e,t,s,o)=>{const c=r(o),l=c.publicKey||i.publicKey,p=c.blockHeadless||i.blockHeadless,u=c.storageProvider||i.storageProvider;if(p)return Promise.reject(new t(451,"Unavailable For Headless Browser"));if(!e||!t||!l)throw"The serviceID/templateID/publicKey required";const d={lib_version:"4.4.1",user_id:l,service_id:e,template_id:t,template_params:s};return a("/api/v1.0/email/send",JSON.stringify(d),{"Content-type":"application/json"})};return e.init=o,e.send=c,Object.defineProperty(e,"__esModule",{value:!0}),e}({});

function writeReport(score, confidence) {
    // string = human-readable message
    if (score >= 4) return { decision: "spam", string: "likely bot spam" }
    if (score === 3 && confidence >= 99.0) return { decision: "unsure", string: "possible bot spam" }
    return { decision: "clean", string: "human text" }
}

function writeFormReport(combinedScore, combinedConfidence, nameEval, messageEval) {
    // customize this function for a more complete written report
    if (combinedScore >= 4) return { decision: "spam", string: "likely bot spam" }
    if (combinedScore === 3 && combinedConfidence >= 99.0) return { decision: "unsure", string: "possible bot spam" }
    return { decision: "clean", string: "human text" }
}
function evaluate(string) {
    var data = {
        length: string.length,
        spaces: 0,
        words: 0,
        average_word_length: 0,
        uppercase_letters: 0,
        consonants: 0,
        vowels: 0,
        vowel_ratio: 0,
        case_switches: 0,
        average_word_case_switches: 0
    }

    // count spaces, words, and average word length
    data.spaces = (string.match(/ /g) || []).length
    data.words = data.spaces + 1 // assume there is a space between each word
    data.average_word_length = data.length / data.words

    // extract letters from string
    const str = string.replace(/[^A-Za-z]/g, "");

    // iterate through letters
    for (i = 0; i < str.length; i++) {
        // count uppercase letters
        if (str[i].toUpperCase() == str[i]) { data.uppercase_letters++ }

        //count vowels and consonants
        const vowels = 'aeiou'
        if (vowels.includes(str[i].toLowerCase())) { data.vowels++ } else { data.consonants++ }

        // count case switches
        if (i > 0) {
            if ((str[i - 1] === str[i - 1].toUpperCase()) !== (str[i] === str[i].toUpperCase())) {
                data.case_switches++
            }
        }
    }
    data.average_word_case_switches = data.case_switches / data.words
    data.vowel_ratio = (data.vowels / data.length) * 100

    // 1. RULE-BASED BLOCKING SCORE
    let score = 0

    if (data.uppercase_letters > data.words) score++ // more uppercase than words
    if (data.average_word_length > 8) score++ // very long words
    if (data.vowel_ratio < 30) score++ // subnormal amount of vowels (average is 40% vowels)
    if (data.average_word_case_switches > 1.5) { // abnormal amount of case switches, score based on severity
        // cap at 2
        score += Math.min(data.average_word_case_switches, 2)
    }

    // 2. PROBABILITY / CONFIDENCE CALCULATION
    const probs = [];

    // --- binary checks with reasonable priors ---
    // prior closer to 1 => more likely to be spam
    if (data.uppercase_letters > data.words) probs.push(0.75);
    if (data.average_word_length > 8) probs.push(0.60);
    if (data.vowel_ratio < 30) probs.push(0.70);

    // --- scaling check via sigmoid ---
    const k = 1.2;
    const threshold = 1.5;
    const x = data.average_word_case_switches;

    // sigmoid → smooth probability for case-switch weirdness
    const P_case = 1 / (1 + Math.exp(-k * (x - threshold)));
    probs.push(P_case);

    // --- combine probabilities via Naive Bayes odds ---
    let oddsProduct = 1;
    for (const p of probs) {
        oddsProduct *= p / (1 - p);
    }

    const spamConfidence = oddsProduct / (1 + oddsProduct); // final probability 0–1

    // 3. SUGGEST ACTION BASED ON SCORE AND CONFIDENCE

    const evaluation = {
        version: version,
        aggregatedData: data,
        spam_score: score,
        spam_confidence: spamConfidence,
        report: writeReport(score, spamConfidence)
    }

    return evaluation
}

/* ----------------------------- REQUEST HANDLER ---------------------------- */

// accept a POST request with a spam string
exports.handler = async (event, context) => {
    // Handle CORS preflight (OPTIONS request)
    const allowedOrigin = "https://616strength.com";
    const origin = event.headers.origin;

    const corsHeaders = {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    };

    // Handle OPTIONS preflight
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ""
        };
    }

    // Reject requests from other origins
    if (origin !== allowedOrigin) {
        return {
            statusCode: 403,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Origin not allowed" })
        };
    }

    // Normal POST request
    let data = {};
    try {
        data = JSON.parse(event.body || "{}");
        console.log(data)

    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
    }
    var result
    if (data.task == "evaluate_string" && typeof data.body === "string") {
        result = evaluate(data.body);
    }

    if (data.task == "evaluate_array" && typeof data.body === "array") {
        console.error("task not available yet")
    }

    if (data.task == "check_form") {
        formEmail = data.body.email
        formName = data.body.name
        formMessage = data.body.message

        const nameEval = formName ? evaluate(data.body.name) : null
        const messageEval = formMessage ? evaluate(data.body.message) : null

        // combined evaluation
        const formParts = [];
        if (formName) formParts.push(formName.trim());
        if (formMessage) formParts.push(formMessage.trim());

        // one string for scoring
        const formEval = evaluate(formParts.join(" "));

        result = formEval
        result.report = writeFormReport(result.spam_score, result.spam_confidence, nameEval, messageEval)
        result.name_evaluation = nameEval
        result.message_evaluation = messageEval

        const emailjsTemplateParams = {
            user_email: formEmail,
            user_name: formName,
            message: formMessage,
            recipient: "616strength@gmail.com",

            moneypenny_evaluation: result // send moneypenny analysis data just for kicks and giggles
        }

        // SEND EMAIL TO 616 STRENGTH

        emailjs.init({
            publicKey: "Z0XokRkh5OmLpT_4K",
        });

        emailjs.send('web_contact_service', 'web_contact_template', emailjsTemplateParams).then(
            function (response) {
                console.log('Sent email via email.js.', response.status, response.text);
            },
            function (err) {
                console.log('Failed to send email...', err);
            },
        );

        if (result.report.decision == "spam" || result.report.decision == "unsure") {
            emailjsTemplateParams.recipient = "louis.h.dev@gmail.com"

            emailjs.send('web_contact_service', 'web_contact_template', emailjsTemplateParams).then(
                function (response) {
                    console.log('Sent email via email.js: spam forwarded to Lou', response.status, response.text);
                },
                function (err) {
                    console.log('Failed to send email...', err);
                },
            );
        }
    }

    return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result)
    };

};
