const { createServer, IncomingMessage, ServerResponse } = require("http");
const { parse } = require("url");

const { createReadStream, appendFileSync } = require("fs");

class Db {
    dbLocation;
    constructor(dbLocation = "./resources/submissions.json") {
        this.dbLocation = dbLocation;
    }

    writeToDb({ name, email, message }) {
        return appendFileSync(
            this.dbLocation,
            JSON.stringify({ name, email, message, timestamp: new Date() }) +
                "\n"
        );
    }
}

const db = new Db();

function validateNonEmptyString(value) {
    return typeof value === "string" && value.trim() !== "";
}

function validateTenCharsMin(value) {
    return (
        typeof value === "string" &&
        value.trim() !== "" &&
        value.trim().length >= 10
    );
}

function submitHandler(req, res) {
    let body = "";
    req.on("data", (chunk) => {
        body += chunk;
    });
    req.on("end", () => {
        try {
            const { name, email, message } = JSON.parse(body);

            if (
                !validateNonEmptyString(name) ||
                !validateNonEmptyString(email) ||
                !validateTenCharsMin(message)
            ) {
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "validation trash" }));
            }

            db.writeToDb({ name, email, message });

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true }));
        } catch (error) {
            console.error(error);
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: "Invalid JSON" }));
        }
    });
}

const server = createServer((req, res) => {
    if (req.url) {
        const url = parse(req.url);
        const pathname = url.pathname;
        console.log(pathname, req.method);
        if (pathname === "/" && req.method === "GET") {
            const file = createReadStream("./resources/index.html");
            res.writeHead(200, {
                "Content-Type": "text/html",
            });
            return file.pipe(res);
        } else if (pathname === "/submit" && req.method === "POST") {
            return submitHandler(req, res);
        }
        res.end();
    }
});

server.listen(3000, () => {
    console.log("Server running");
});
