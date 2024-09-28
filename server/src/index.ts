import app from "./app";

console.log("Hello, world!");

app
  .listen(3000, () => {
    console.log("Server is listening on port 3000");
  })
  .on("error", (err) => {
    console.error(err);
  });
