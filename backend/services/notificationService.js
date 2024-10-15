const { where } = require('sequelize');
const Notification = require('../models/notification');

// find all the noti if it exist add suffix to title to differentiate
exports.uploadNoti = async (title, content, owner) => {
    try {
        const timeStamp = Date.now();
        const duplicateCheck = await Notification.findAll({
            where: {
                title,
                owner
            }
        })
        let suffix = "";
        if (duplicateCheck) {
            if(duplicateCheck.length > 1){
                suffix = ` [${duplicateCheck.length + 1}]`;
            }
        }

        await Notification.create({
            title: title + suffix,
            content,
            timeStamp,
            owner,
            isRead: false,
        });

        return { message: 'Notification uploaded successfully!' }


    } catch (error) {
        console.error("Error uploading notification:", error);
        return { message: "Error uploading notification" };
    }
};

// update noti record in db
exports.updateNotiById = async (id, data) => {
    try {
        
        const notificationToUpdate = await Notification.findOne({
            where: {
                id
            }
        });

        if (!notificationToUpdate) {
            return { message: 'Notification not found' };
        }

        const [affectedRows] = await Notification.update(data, {
            where: {
                id
            }
        });

        // if (affectedRows === 0) {
        //     console.log("Problem occurred during the updating process or id of the noti is incorrect.");
        //     return { message: 'Error updating notification' };
        // }

        return { message: 'Notification updated successfully!' };

    } catch (error) {
        console.error("Error updating notification:", error);
        return { message: "Error updating notification" };
    }
};




// delete noti record in the db
exports.deleteNotiById = async (id) => {
    try {

        const notificationToDelete = await Notification.findOne({
            where: {
                id
            }
        });
        if (!notificationToDelete) {
            return { message: 'Notification not found' };
        }

        // Delete notification record from database
        await Notification.destroy({
            where: {
                id
            }
        })

        return { message: 'Notification deleted successfully!' };

    } catch (err) {
        // throw new Error(`Error deleting notification: ${err.message}`);
        console.err(`Error deleting notification: ${err.message}`)
        return { message: `Error deleting notification` }
    }
};


// get all notis from the db
exports.getNotis = async (owner) => {
    try {
        const notifications = await Notification.findAll({
            where: {
                owner
            }
        });

        if(notifications.length === 0){
            return {message: "Failed to get notifications!"};
        }

        //return the array of notifications that contains title, owner, content, timestamp, isRead
        return { message: 'Get notifications successfully!', notifications };

    } catch (err) {
        // throw new Error(`Error getting notifications: ${err.message}`);
        console.error(`Error getting notifications: ${err.message}`)
        return { message: `Error getting notifications` }

    }
};

