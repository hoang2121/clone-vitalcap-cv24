require('dotenv').config();
const request = require("supertest");
const app = require("../index");
const env = require("dotenv");
env.config();
const test_user = process.env.TEST_USER;
console.log(test_user);
// require('dotenv').config();

describe("Tests for Profile", () => {
    let accessToken = "";

    // Create Token for Integration Testing
    beforeAll(async () => {
        try {
            // // wrong pass
            // const response1 = await request(app)
            //     .post("/api/v1/auth/signup")
            //     .send({
            //         email: test_user,
            //         password: "123456"
            //     });
            // // wrong passs
            // const response = await request(app)
            //     .post("/api/v1/auth/login")
            //     .send({
            //         email: test_user,
            //         password: "123456"
            //     });
            // // => accessToken
            // if (response.status === 200) {
            //     accessToken = response.body.accessToken;
            // } else {
            //     throw new Error("Failed to receive the new access token");
            // }
            accessToken = process.env.ACCESS_TOKEN_TEST;

        } catch (error) {
            console.error("Error in beforeAll:", error);
            throw error;
        }
    });
    afterAll(async () => {
        try {
            // console.log("After")
            const response = await request(app)
                .put(`/api/v1/profile/updateProfile/${test_user}`)
                .set("authorization", accessToken)
                .send({
                    firstName: "test",
                    lastName: "test"
                });
        } catch (error) {
            console.error("Error in afterAll:", error);
        }
    });


    it("Should update a profile's data successfully", async () => {
        try {
            const response = await request(app)
                .put(`/api/v1/profile/updateProfile/${test_user}`)
                .set("authorization", accessToken)
                .send({
                    firstName: "ha",
                    lastName: "da"
                });
            console.log(response.body);
            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Profile updated!");
        } catch (error) {
            console.error("Error in test 'Should update a profile's data successfully':", error);
            throw error;
        }
    });

    it("Should get a profile's data successfully", async () => {
        try {
            const response = await request(app)
                .get(`/api/v1/profile/getProfile/${test_user}`)
                .set("authorization", accessToken);
            console.log(response.body);
            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty("firstName");
            expect(response.body.data).toHaveProperty("lastName");
            expect(response.body.message).toBe("Profile found!");
        } catch (error) {
            console.error("Error in test 'Should get a profile's data successfully':", error);
            throw error;
        }
    });

    it("Should delete a profile successfully", async () => {
        try {
            const response = await request(app)
                .delete(`/api/v1/profile/deleteProfile/${test_user}`)
                .set("authorization", accessToken)
                .send({
                    firstName: "ha",
                    lastName: "da"
                });
            console.log(response.body);
            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Profile deleted!");
        } catch (error) {
            console.error("Error in test 'Should delete a profile successfully':", error);
            throw error;
        }
    });

    // Run by using command npx jest --detectOpenHandles profile.test.js
});
