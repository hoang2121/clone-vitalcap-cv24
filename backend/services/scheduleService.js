const { where } = require('sequelize');
const Schedule = require('../models/schedule');
const Notification = require('../models/notification');
const { uploadNoti } = require("./notificationService")
const { Sequelize } = require('sequelize');

// Find all the schedules by name, if they exist add a suffix to title to differentiate,
// then send notifications to tagged emails
exports.uploadSchedule = async (sendTo, owner, appointmentName, content, timeAppointed, timeCreated) => {
    try {
        // Check for duplicate appointment names
        const duplicateCheck = await Schedule.findAll({
            where: {
                owner,
                appointmentName
            }
        });

        // Generate a suffix if duplicates exist
        let suffix = "";
        if (duplicateCheck.length > 0) {
            suffix = ` [${duplicateCheck.length + 1}]`;
        }

        // Process email addresses
        let emails = sendTo.split(",").map(email => email.trim()).filter(email => email);
        if (emails.length === 0) {
            return { message: 'The tagged emails are empty!' };
        }

        // Prepare notification content for the owner
        let title = `You have uploaded your appointment: ${appointmentName}`;
        let notificationContent = `The appointment '${appointmentName}' was uploaded successfully.`;

        // Check and update notification for the owner
        const notificationToUpdate = await Notification.findOne({
            where: {
                owner,
                title,
                content: notificationContent
            },
            order: [['id', 'DESC']]
        });

        if (!notificationToUpdate) {
            await uploadNoti(title, notificationContent, owner);
        }

        // Prepare notifications for each tagged email
        const promises = emails.map(async (email) => {
            let title = `The ${owner} just created an appointment for you`;
            let content = `The appointment '${appointmentName}' was created by ${owner} a few seconds ago and shared with you: ${email}.`;
            await uploadNoti(title, content, email);
        });

        // Wait for all email notifications to complete
        await Promise.all(promises);

        // Create a schedule entry in the database
        await Schedule.create({
            appointmentName: appointmentName + suffix,
            sendTo,
            owner,
            content,
            timeAppointed,
            timeCreated
        });

        return { message: 'Upload Schedule successfully!' };

    } catch (error) {
        console.error("Error uploading schedule:", error);
        return { message: "Error uploading schedule" };
    }
};

// Update schedule record in the database
exports.updateScheduleByName = async (appointmentName, email, data) => {
    try {
        // Find the schedule by owner and appointment name
        const foundSchedule = await Schedule.findOne({
            where: {
                owner: email,
                appointmentName
            }
        });

        if (!foundSchedule) {
            return { message: "Can't find the schedule, or you are not allow to update schedule!" };
        }

        // Update the schedule with the new data
        const [affectedRows] = await Schedule.update(data, {
            where: {
                appointmentName,
                owner: email,
            }
        });

        // Notify tagged users
        let emails = foundSchedule.sendTo ? foundSchedule.sendTo.split(",").map(email => email.trim()).filter(email => email) : [];
        if (emails.length === 0) {
            return { message: 'The tagged emails are empty!' };
        }

        // Notify the owner
        // Notify the owner about the deletion
        let title = `You have updated your appointment: ${appointmentName}`;
        let content = `The appointment '${appointmentName}' was deleted successfully.`;

        const notificationToUpdate = await Notification.findOne({
            where: {
                owner: email,
                title
            },
            order: [['id', 'DESC']]
        });

        // If a notification was not found, create one
        if (!notificationToUpdate) {
            await uploadNoti(title, content, email);
        }

        // Notify each tagged user
        const promises = emails.map(async (em) => {
            let userTitle = `The ${email} just updated an appointment for you: ${appointmentName}`;
            let userContent = `The appointment '${appointmentName}' was updated by its owner: ${email}, and shared with you: ${em}. Description: ${data.description || 'No description provided.'}`;
            await uploadNoti(userTitle, userContent, em);
        });

        // Wait for all notifications to be sent
        await Promise.all(promises);

        return { message: 'Schedule updated successfully!' };

    } catch (error) {
        console.error("Error updating schedule:", error);
        return { message: "Error updating schedule" };
    }
};





// Delete schedule record from the database
exports.deleteScheduleByName = async (appointmentName, email) => {
    try {
        // Find the schedule by owner and appointment name
        const scheduleToDelete = await Schedule.findOne({
            where: {
                owner: email,
                appointmentName
            }
        });

        if (!scheduleToDelete) {
            return { message: 'Schedule not found or you are not allow to delete schedule!' };
        }

        // Notify tagged users before deletion
        let emails = scheduleToDelete.sendTo ? scheduleToDelete.sendTo.split(",").map(email => email.trim()).filter(email => email) : [];
        if (emails.length === 0) {
            return { message: 'The tagged emails are empty!' };
        }

        // Notify the owner about the deletion
        let title = `You have deleted your appointment: ${appointmentName}`;
        let content = `The appointment '${appointmentName}' was deleted successfully.`;

        const notificationToUpdate = await Notification.findOne({
            where: {
                owner: email,
                title,
                content
            },
            order: [['id', 'DESC']]
        });
        if (!notificationToUpdate) {
            await uploadNoti(title, content, email);
        }

        // Notify each tagged user about the deletion
        const promises = emails.map(async (em) => {
            let title = `The ${email} has deleted an appointment: ${appointmentName}`;
            let content = `The appointment '${appointmentName}' was deleted by its owner: ${email}. It was previously shared with you: ${em}.`;
            await uploadNoti(title, content, em);
        });

        // Wait for all notifications to be sent
        await Promise.all(promises);

        // Delete the schedule record from the database
        await Schedule.destroy({
            where: {
                appointmentName,
                owner: email
            }
        });

        return { message: 'Schedule deleted successfully!' };

    } catch (err) {
        console.error(`Error deleting schedule: ${err.message}`);
        return { message: 'Error deleting schedule' };
    }
};



// get all schedules from the db by email
exports.getSchedules = async (email) => {
    try {
        // console.log(email);
        // get schedules belonging to email or invited email
        const schedules = await Schedule.findAll({
            where: {
                [Sequelize.Op.or]: [
                    { owner: email },
                    { sendTo: { [Sequelize.Op.like]: `%${email}%` } }
                ]
            }
        });

        // console.log(schedules)

        if (schedules.length === 0) {
            return { message: "Failed to get schedules!" };
        }

        //return the array of schedules that contains sendTo, owner, appointmentName,content,timeAppointed, timeCreated
        return { message: 'Get schedules successfully!', schedules };

    } catch (err) {
        // throw new Error(`Error getting schedules: ${err.message}`);
        console.error(`Error getting schedules: ${err.message}`)
        return { message: `Error getting schedules` }

    }
};


