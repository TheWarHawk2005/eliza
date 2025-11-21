// moneypenny.js
// A custom-made spam filter for 616 Strength & Nutrition

// Miss Moneypenny's complete script. Running on the server.
const version = "0.0.0"

console.log("PUBLIC:", process.env.MJ_APIKEY_PUBLIC);
console.log("PRIVATE:", process.env.MJ_APIKEY_PRIVATE);


const mailjet = require('node-mailjet').apiConnect(
    process.env.MJ_APIKEY_PUBLIC,
    process.env.MJ_APIKEY_PRIVATE
)

function writeReport(score, confidence) {
    // string = human-readable message
    if (score >= 4) return { decision: "spam", string: "likely bot spam" }
    if (score === 3 && confidence >= 99.0) return { decision: "unsure", string: "possible bot spam" }
    return { decision: "clean", string: "likely human text" }
}

function writeFormReport(combinedScore, combinedConfidence, nameEval, messageEval) {
    // customize this function for a more complete written report
    if (combinedScore >= 4) return { decision: "spam", string: "likely bot spam" }
    if (combinedScore === 3 && combinedConfidence >= 99.0) return { decision: "unsure", string: "possible bot spam" }
    return { decision: "clean", string: "likely human text" }
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
            headers: corsHeaders,
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

    var result;

    if (data.task == "evaluate_string" && typeof data.body === "string") {
        result = evaluate(data.body);
        console.log(result)
    }

    if (data.task == "evaluate_array" && Array.isArray(data.body)) { // <--- fix here
        console.error("task not available yet")
    }

    if (data.task == "test_mailjet") {
        console.log('testing mailjet...')

        if (data.task == "test_mailjet") {
            console.log('testing mailjet...');

            try {
                const result = await mailjet.post('send', { version: 'v3.1' }).request({
                    Messages: [
                        {
                            From: { Email: 'louis.h.dev@gmail.com', Name: 'Ms. Moneypenny' },
                            To: [{ Email: 'louis.h.dev@gmail.com', Name: 'You' }],
                            Subject: 'Mailjet Test',
                            TextPart: 'Mailjet test email.',
                            HTMLPart: '<h3>html header test</h3>',
                        },
                    ],
                });

                console.log(result.body); // success
            } catch (err) {
                console.error(err.statusCode || err.message); // failed
            }
        }
    }

    if (data.task == "check_form" && data.body && typeof data.body === "object") { // <--- fix here
        const formEmail = data.body.email
        const formName = data.body.name
        const formMessage = data.body.message

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

        const templateVariables = {
            user_email: formEmail,
            user_name: formName,
            message: formMessage,
            moneypenny_report: result.report.string,
            moneypenny_score: result.spam_score,
            moneypenny_confidence: result.spam_confidence
        };


        // SEND EMAIL TO 616 STRENGTH
        try {
            const mailjetResult = await mailjet
                .post("send", { version: "v3.1" })
                .request({
                    Messages: [
                        {
                            From: { Email: "616strength@616strength.com", Name: "616 Strength & Nutrition" },
                            To: [{ Email: "louis.h.harrison@gmail.com", Name: "Louis H" }],
                            Subject: `New Message from ${formName}`,
                            TemplateID: 7511790,
                            TemplateLanguage: true,
                            Variables: templateVariables
                        }
                    ]
                });

            console.log(mailjetResult.body);
        } catch (err) {
            console.error("Mailjet error:", err.statusCode || err.message || err);
        }


        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify(result)
        };
    }
}
