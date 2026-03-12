const faker = require("@faker-js/faker").fakerEN_US;
const User = require("../models/User");
const Job = require("../models/Job");

const TEST_USER_EMAIL = "test-crud@example.com";
const testUserPassword = "testPassword123";

function buildUser(overrides = {}) {
    return {
        name: overrides.name ?? faker.person.fullName(),
        email: overrides.email ?? faker.internet.email(),
        ...overrides,
    };
}

function buildJob(overrides = {}) {
    return {
        company: overrides.company ?? faker.company.name(),
        position: overrides.position ?? faker.person.jobTitle(),
        status: overrides.status ?? "pending",
        ...overrides,
    };
}

const factory = {
    build: async (name, attrs = {}) => {
        if (name === "user") return buildUser(attrs);
        if (name === "job") return buildJob(attrs);
        throw new Error(`Unknown factory: ${name}`);
    },
};

async function seed_db() {
    const existing = await User.findOne({ email: TEST_USER_EMAIL });
    if (existing) {
        await Job.deleteMany({ createdBy: existing._id });
        await User.deleteOne({ _id: existing._id });
    }
    const testUser = await User.create({
        name: "Test User",
        email: TEST_USER_EMAIL,
        password: testUserPassword,
    });
    const statuses = ["pending", "interview", "declined"];
    for (let i = 0; i < 20; i++) {
        await Job.create({
            company: faker.company.name(),
            position: faker.person.jobTitle(),
            status: statuses[i % 3],
            createdBy: testUser._id,
        });
    }
    return testUser;
}

module.exports = { factory, seed_db, testUserPassword };
