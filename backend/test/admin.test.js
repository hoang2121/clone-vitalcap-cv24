require('dotenv').config();
const request = require("supertest");
const app = require("../index");
const env = require("dotenv");
env.config();
const test_user = process.env.TEST_USER;

describe("Tests for Admin Features", () => {
    let accessToken = "";

    // Create Token for Integration Testing
    beforeAll(async () => {
        try {
            const response = await request(app)
                .post("/api/v1/auth/signup")
                .send({
                    email: "test1@gmail.com",
                    password: "123456"
                });

            const res = await request(app)
                .post("/api/v1/auth/signup")
                .send({
                    email: "test@gmail.com",
                    password: "123456"
            });

   
            accessToken = process.env.ACCESS_TOKEN_TEST;
        } catch (error) {
            console.error("Error in beforeAll:", error);
            throw error;
        }
    });

  
    it("Should successfully get the information of all users", async () => {
        try {
            const response = await request(app)
                .get("/api/v1/admin/users")
                .set("authorization", accessToken);
            console.log(response.body);
            expect(response.status).toBe(200);
            response.body.forEach(user => {
                expect(user).toHaveProperty("email");
                // expect(user).toHaveProperty("fistna");
            });
        } catch (error) {
            console.error("Error in test 'Should successfully get the information of all users':", error);
            throw error;
        }
    });

    // wrong token
    it("Should successfully modify the information of a user", async () => {
        try {
            const response = await request(app)
                .put(`/api/v1/admin/modify/${test_user}`)
                .set("authorization", accessToken)
                .send({
                    firstName: "Nguyen"
                });
            // console.log(response.body);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("message");
            expect(response.body.message).toBe("User updated successfully!");
        } catch (error) {
            console.error("Error in test 'Should successfully modify the information of a user':", error);
            throw error;
        }
    });

    // wrong token
    it("Should successfully delete the information of a user", async () => {
        try {
            const response = await request(app)
                // Use refresh token or login to get the new access token (this one is the old one)
                // Signup the account again after done deleting test (if the deleting test failed, it may be because the account is deleted by the test)
                .delete(`/api/v1/admin/delete/${"test1@gmail.com"}`)
                .set("authorization", accessToken);
            // console.log(response.body);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("message");
            expect(response.body.message).toBe("User deleted successfully!");
        } catch (error) {
            console.error("Error in test 'Should successfully delete the information of a user':", error);
            throw error;
        }
    });

    // afterAll(async () => {
    //     try {
    //         await request(app)
    //             .post("/api/v1/auth/signup")
    //             .send({
    //                 email: test_user,
    //                 password: "123456"
    //             });
    //     } catch (error) {
    //         console.error("Error in afterAll:", error);
    //         throw error;
    //     }
    // });

    // Run by using command npx jest --detectOpenHandles admin.test.js
});
