// moneypenny.js
// A custom-made spam filter for 616 Strength & Nutrition

// Miss Moneypenny's complete script. Running on the server.
const version = "0.0.0"

function determineConsensus(score, confidence) {
    // string = human-readable message, suggested_action = whether or not to block, review = forward to Lou
    if (score >= 4) return { string: "likely spam", suggested_action: "block", review: true }
    if (score === 3 && confidence >= 99.0) return { string: "possible spam", suggested_action: "deliver", review: true }
    return { string: "clean", suggested_action: "deliver", review: true }
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
        decision: determineConsensus(score, spamConfidence)
    }

    return evaluation
}

/* ----------------------------- REQUEST HANDLER ---------------------------- */

// accept a POST request with a spam string
exports.handler = async (event, context) => {
    // Handle CORS preflight (OPTIONS request)
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "https://616strength.com",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            },
            body: ""
        };
    }

    // Normal POST request
    const { string } = JSON.parse(event.body || "{}");

    const result = evaluate(string);

    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "https://616strength.com",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "POST, OPTIONS"
        },
        body: JSON.stringify(result)
    };
};
