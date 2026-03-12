const puppeteer = require("puppeteer");
const { app, start } = require("../app");
const { seed_db, testUserPassword } = require("../utils/seed_db");
const Job = require("../models/Job");

let testUser = null;
let page = null;
let browser = null;
let server = null;

describe("jobs-ejs puppeteer test", function () {
    before(async function () {
        this.timeout(15000);
        server = await start();
        if (!server) throw new Error("Server failed to start");
        browser = await puppeteer.launch();
        page = await browser.newPage();
        await page.goto("http://localhost:3000");
    });
    after(async function () {
        this.timeout(5000);
        if (browser) await browser.close();
        if (server) await new Promise((resolve) => server.close(resolve));
    });
    describe("got to site", function () {
        it("should have completed a connection", async function () { });
    });
    describe("index page test", function () {
        this.timeout(10000);
        it("finds the index page logon link", async () => {
            this.logonLink = await page.waitForSelector(
                "a ::-p-text(Click this link to logon)",
            );
        });
        it("gets to the logon page", async () => {
            await this.logonLink.click();
            await page.waitForNavigation();
            const email = await page.waitForSelector('input[name="email"]');
        });
    });
    describe("logon page test", function () {
        this.timeout(20000);
        it("resolves all the fields", async () => {
            this.email = await page.waitForSelector('input[name="email"]');
            this.password = await page.waitForSelector('input[name="password"]');
            this.submit = await page.waitForSelector("button ::-p-text(Logon)");
        });
        it("sends the logon", async () => {
            testUser = await seed_db();
            await this.email.type(testUser.email);
            await this.password.type(testUserPassword);
            await this.submit.click();
            await page.waitForNavigation();
            await page.waitForSelector(`p ::-p-text(${testUser.name} is logged on.)`);
            await page.waitForSelector("a ::-p-text(change the secret)");
            await page.waitForSelector('a[href="/secretWord"]');
            const copyr = await page.waitForSelector("p ::-p-text(copyright)");
            const copyrText = await copyr.evaluate((el) => el.textContent);
            console.log("copyright text: ", copyrText);
        });
    });
    describe("puppeteer job operations", function () {
        this.timeout(20000);
        it("should open jobs list and show 20 entries", async function () {
            const { expect } = await import("chai");
            const jobsLink = await page.waitForSelector('a[href="/jobs"]');
            await jobsLink.click();
            await page.waitForNavigation();
            await page.waitForSelector("#jobs-table");
            const content = await page.content();
            const trParts = content.split("<tr>");
            expect(trParts.length).to.equal(21);
        });
        it("open 'add job' form and have company, position, and add button", async function () {
            const { expect } = await import("chai");
            const addJobLink = await page.waitForSelector('a[href="/jobs/new"]');
            await addJobLink.click();
            await page.waitForNavigation();
            await page.waitForSelector('form[action="/jobs"]');
            this.companyField = await page.$('input[name="company"]');
            this.positionField = await page.$('input[name="position"]');
            this.createButton = await page.$('form[action="/jobs"] button');
            expect(this.companyField).to.not.be.null;
            expect(this.positionField).to.not.be.null;
            expect(this.createButton).to.not.be.null;
        });
        it("submit new job have entry in db", async function () {
            const { expect } = await import("chai");
            const companyValue = "microsoft";
            const positionValue = "developer";
            await this.companyField.type(companyValue);
            await this.positionField.type(positionValue);
            await this.createButton.click();
            await page.waitForNavigation();
            await page.waitForSelector("#jobs-table");
            const content = await page.content();
            expect(content).to.include("Job created");
            const jobs = await Job.find({ createdBy: testUser._id })
                .sort({ createdAt: -1 })
                .limit(1)
                .lean();
            expect(jobs.length).to.equal(1);
            expect(jobs[0].company).to.equal(companyValue);
            expect(jobs[0].position).to.equal(positionValue);
        });
    });
});