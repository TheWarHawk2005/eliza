exports.handler = async (event, context) => {
  const data = JSON.parse(event.body || "{}");
  const version = "0.0.0"
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello my name is Eliza :)", version, data })
  };
};
