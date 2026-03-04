const Job = require("../models/Job");
const parseValidationErrors = require("../utils/parseValidationErr");

async function getAllJobs(req, res) {
    const jobs = await Job.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.render("jobs", { jobs });
}

function getNewForm(req, res) {
    res.render("job", { job: null });
}

async function createJob(req, res) {
    try {
        req.body.createdBy = req.user._id;
        await Job.create(req.body);
        req.flash("info", "Job created.");
        res.redirect("/jobs");
    } catch (e) {
        if (e.name === "ValidationError") {
            parseValidationErrors(e, req);
            return res.render("job", { job: null, body: req.body });
        }
        throw e;
    }
}

async function getEditForm(req, res) {
    const job = await Job.findOne({
        _id: req.params.id,
        createdBy: req.user._id,
    });
    if (!job) {
        req.flash("error", "Job not found");
        return res.redirect("/jobs");
    }
    res.render("job", { job });
}

async function updateJob(req, res) {
    const job = await Job.findOne({
        _id: req.params.id,
        createdBy: req.user._id,
    });
    if (!job) {
        req.flash("error", "Job not found");
        return res.redirect("/jobs");
    }
    try {
        job.company = req.body.company;
        job.position = req.body.position;
        job.status = req.body.status;
        await job.save();
        req.flash("info", "Job updated.");
        res.redirect("/jobs");
    } catch (e) {
        if (e.name === "ValidationError") {
            parseValidationErrors(e, req);
            Object.assign(job, req.body);
            return res.render("job", { job });
        }
        throw e;
    }
}

async function deleteJob(req, res) {
    const result = await Job.findOneAndDelete({
        _id: req.params.id,
        createdBy: req.user._id,
    });
    if (!result) {
        req.flash("error", "Job not found");
    } else {
        req.flash("info", "Job deleted.");
    }
    res.redirect("/jobs");
}

module.exports = {
    getAllJobs,
    getNewForm,
    createJob,
    getEditForm,
    updateJob,
    deleteJob,
};
