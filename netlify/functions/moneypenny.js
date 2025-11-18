// moneypenny.js
// A custom-made spam filter for 616 Strength & Nutrition

// Miss Moneypenny's complete script. Running on the server.
const version = "0.0.0"

// Load emailjs
var emailjs = function (e) { "use strict"; class t { constructor() { let e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0, t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "Network Error"; this.status = e, this.text = t } } const i = { origin: "https://api.emailjs.com", blockHeadless: !1, storageProvider: (() => { if ("undefined" != typeof localStorage) return { get: e => Promise.resolve(localStorage.getItem(e)), set: (e, t) => Promise.resolve(localStorage.setItem(e, t)), remove: e => Promise.resolve(localStorage.removeItem(e)) } })() }, r = e => e ? "string" == typeof e ? { publicKey: e } : "[object Object]" === e.toString() ? e : {} : {}, o = function (e) { let t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "https://api.emailjs.com"; if (!e) return; const o = r(e); i.publicKey = o.publicKey, i.blockHeadless = o.blockHeadless, i.storageProvider = o.storageProvider, i.blockList = o.blockList, i.limitRate = o.limitRate, i.origin = o.origin || t }, a = async function (e, r) { let o = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {}; const a = await fetch(i.origin + e, { method: "POST", headers: o, body: r }), s = await a.text(), n = new t(a.status, s); if (a.ok) return n; throw n }, s = (e, t, i) => { if (!e || "string" != typeof e) throw "The public key is required. Visit https://dashboard.emailjs.com/admin/account"; if (!t || "string" != typeof t) throw "The service ID is required. Visit https://dashboard.emailjs.com/admin"; if (!i || "string" != typeof i) throw "The template ID is required. Visit https://dashboard.emailjs.com/admin/templates" }, n = e => e.webdriver || !e.languages || 0 === e.languages.length, l = () => new t(451, "Unavailable For Headless Browser"), c = (e, t) => { if ((e => !e.list?.length || !e.watchVariable)(e)) return !1; ((e, t) => { if (!Array.isArray(e)) throw "The BlockList list has to be an array"; if ("string" != typeof t) throw "The BlockList watchVariable has to be a string" })(e.list, e.watchVariable); const i = (r = t, o = e.watchVariable, r instanceof FormData ? r.get(o) : r[o]); var r, o; return "string" == typeof i && e.list.includes(i) }, d = () => new t(403, "Forbidden"), m = async (e, t, i) => { if (!t.throttle || !i) return !1; ((e, t) => { if ("number" != typeof e || e < 0) throw "The LimitRate throttle has to be a positive number"; if (t && "string" != typeof t) throw "The LimitRate ID has to be a non-empty string" })(t.throttle, t.id); const r = t.id || e, o = await (async (e, t, i) => { const r = Number(await i.get(e) || 0); return t - Date.now() + r })(r, t.throttle, i); return o > 0 || (await i.set(r, Date.now().toString()), !1) }, h = () => new t(429, "Too Many Requests"), p = async (e, t, o, p) => { const u = r(p), b = u.publicKey || i.publicKey, g = u.blockHeadless || i.blockHeadless, f = u.storageProvider || i.storageProvider, w = { ...i.blockList, ...u.blockList }, y = { ...i.limitRate, ...u.limitRate }; if (g && n(navigator)) return Promise.reject(l()); if (s(b, e, t), (e => { if (e && "[object Object]" !== e.toString()) throw "The template params have to be the object. Visit https://www.emailjs.com/docs/sdk/send/" })(o), o && c(w, o)) return Promise.reject(d()); if (await m(location.pathname, y, f)) return Promise.reject(h()); const v = { lib_version: "4.4.1", user_id: b, service_id: e, template_id: t, template_params: o }; return a("/api/v1.0/email/send", JSON.stringify(v), { "Content-type": "application/json" }) }, u = async (e, t, o, p) => { const u = r(p), b = u.publicKey || i.publicKey, g = u.blockHeadless || i.blockHeadless, f = i.storageProvider || u.storageProvider, w = { ...i.blockList, ...u.blockList }, y = { ...i.limitRate, ...u.limitRate }; if (g && n(navigator)) return Promise.reject(l()); const v = (e => "string" == typeof e ? document.querySelector(e) : e)(o); s(b, e, t), (e => { if (!e || "FORM" !== e.nodeName) throw "The 3rd parameter is expected to be the HTML form element or the style selector of the form" })(v); const j = new FormData(v); return c(w, j) ? Promise.reject(d()) : await m(location.pathname, y, f) ? Promise.reject(h()) : (j.append("lib_version", "4.4.1"), j.append("service_id", e), j.append("template_id", t), j.append("user_id", b), a("/api/v1.0/email/send-form", j)) }; var b = { init: o, send: p, sendForm: u, EmailJSResponseStatus: t }; return e.EmailJSResponseStatus = t, e.default = b, e.init = o, e.send = p, e.sendForm = u, Object.defineProperty(e, "__esModule", { value: !0 }), e }({});

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
    const { data } = JSON.parse(event.body || "{}");

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

        result = {
            version: version,
            aggregatedData: data,
            spam_score: score,
            spam_confidence: spamConfidence,
            name_evaluation: nameEval,
            message_evaluation: messageEval,
            report: writeFormReport(score, spamConfidence),
        }

        const emailjsTemplateParams = {
            user_email: formEmail,
            user_name: formName,
            message: formMessage,
            recipient: "616strength@gmail.com",

            moneypenny_evaluation: result // send moneypenny analysis data just for kicks and giggles
        }

        // SEND EMAIL TO 616 STRENGTH
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
