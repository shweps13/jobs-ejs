const { app } = require("../app");
const get_chai = require("../utils/get_chai");
const connectDB = require("../db/connect");
const Job = require("../models/Job");
const { seed_db, testUserPassword, factory } = require("../utils/seed_db");

describe("CRUD operations for jobs", function () {
    before(async function () {
        const uri =
            process.env.NODE_ENV === "test"
                ? process.env.MONGO_URI_TEST || process.env.MONGO_URI
                : process.env.MONGO_URI;
        await connectDB(uri);
        const { expect, request } = await get_chai();
        this.test_user = await seed_db();
        let req = request.execute(app).get("/sessions/logon").send();
        let res = await req;
        const textNoLineEnd = res.text.replaceAll("\n", "");
        this.csrfToken = /_csrf\" value=\"(.*?)\"/.exec(textNoLineEnd)[1];
        let cookies = res.headers["set-cookie"];
        this.csrfCookie = cookies.find((element) =>
            element.startsWith("csrfToken"),
        );
        const dataToPost = {
            email: this.test_user.email,
            password: testUserPassword,
            _csrf: this.csrfToken,
        };
        req = request
            .execute(app)
            .post("/sessions/logon")
            .set("Cookie", this.csrfCookie)
            .set("content-type", "application/x-www-form-urlencoded")
            .redirects(0)
            .send(dataToPost);
        res = await req;
        cookies = res.headers["set-cookie"];
        this.sessionCookie = cookies.find((element) =>
            element.startsWith("connect.sid"),
        );
        expect(this.csrfToken).to.not.be.undefined;
        expect(this.sessionCookie).to.not.be.undefined;
        expect(this.csrfCookie).to.not.be.undefined;
    });

    it("should get the job list with 20 entries", async function () {
        const { expect, request } = await get_chai();
        const cookieHeader = [
            this.csrfCookie.split(";")[0].trim(),
            this.sessionCookie.split(";")[0].trim(),
        ].join("; ");
        const req = request
            .execute(app)
            .get("/jobs")
            .set("Cookie", cookieHeader)
            .send();
        const res = await req;
        expect(res).to.have.status(200);
        expect(res).to.have.property("text");
        const pageParts = res.text.split("<tr>");
        expect(pageParts.length).to.equal(21);
    });

    it("should add a job entry", async function () {
        const { expect, request } = await get_chai();
        const jobData = await factory.build("job");
        const dataToPost = {
            company: jobData.company,
            position: jobData.position,
            status: jobData.status,
            _csrf: this.csrfToken,
        };
        const cookieHeader = [
            this.csrfCookie.split(";")[0].trim(),
            this.sessionCookie.split(";")[0].trim(),
        ].join("; ");
        const req = request
            .execute(app)
            .post("/jobs")
            .set("Cookie", cookieHeader)
            .set("content-type", "application/x-www-form-urlencoded")
            .send(dataToPost);
        await req;
        const jobs = await Job.find({ createdBy: this.test_user._id });
        expect(jobs.length).to.equal(21);
    });
});
