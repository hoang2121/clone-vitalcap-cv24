require('dotenv').config();
const request = require("supertest");
const app = require("../index");
const admin = require("firebase-admin");
const env = require("dotenv");
env.config();
const test_user= process.env.TEST_USER;
// console.log(test_user)


describe("Tests for Authentication Features", () => {
    // let accessToken = "";
    beforeAll(async () => {

        let loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({
            email: test_user,
            password: "123456"
        });

        // console.log(loginResponse.status)

        if (loginResponse.status !== 200) {
            await request(app)
                .post("/api/v1/auth/signup")
                .send({
                    email: test_user,
                    password: "123456"
                });
            
            // Thử đăng nhập lại sau khi đăng ký
            loginResponse = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    email: test_user,
                    password: "123456"
                });
        }


        if (loginResponse.status === 200) {
            let res = await request(app)
            .delete(`/api/v1/auth/delete-auth`)
            .send({
                email: test_user,
                password: "123456"
            })

        } 

    })


    it("Should signup successfully with sufficient email", async () => {
        const response = await request(app)
            .post("/api/v1/auth/signup")
            .send({
                email: test_user,
                password: "123456"
            });
        // console.log(response)    
        expect(response.status).toBe(200);
        expect(response.body.email).toBe(test_user);
    });


    it("Should signup fail with existing email", async () => {
        const response = await request(app)
            .post("/api/v1/auth/signup")
            .send({
                email: test_user,
                password: "123456"
            });
        // console.log(response.body);
        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Email already in use");
    });


    it("Should login successfully with sufficient user email", async () => {
        const response = await request(app)
            .post("/api/v1/auth/login")
            .send({
                email: test_user,
                password: "123456"
            });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("accessToken");
        expect(response.body).toHaveProperty("refreshToken");
        expect(response.body.user.email).toBe(test_user);
    });


    it("Should fail with incorrect credentials", async () => {
        const response = await request(app)
            .post("/api/v1/auth/login")
            .send({
                email: test_user,
                password: "incorrectpassword"
            });
        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Invalid Credentials");
    });
    it("Should fail with missing password", async () => {
        const response = await request(app)
            .post("/api/v1/auth/login")
            .send({
                email: test_user,
            });
        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Missing password");
    });


    it("Should fail with missing email", async () => {
        const response = await request(app)
            .post("/api/v1/auth/login")
            .send({
                password: "123456"
            });
        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Missing email");
    });



    it("Should receive a new token successfully", async () => {
        const response = await request(app)
            .post("/api/v1/auth/refresh-token")
            .set("authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7ImVtYWlsIjoidXNlcmhvYW5nQGdtYWlsLmNvbSJ9LCJpYXQiOjE3MjEwMDY3ODAsImV4cCI6MTcyMTAwODU4MH0.3XHSbzf-ocLPAiFYgQEBwf5jIEBJCOPTIOg6HsC4gB4")
            .send({
                "refreshToken": "IKFOow7kMTWDhna71Qql4tYcgyVZhgyxXN0IW8zrhwbKtDTVSj"
            });
        // console.log(response.body);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("accessToken");
    });


    // it("Should change password successfully", async () => {
    //     const response = await request(app)
    //         .put("/api/v1/auth/change-password")
    //         .send({
    //             "email": test_user,
    //             "password": "123456",
    //             "newPassword" : "1234567",
    //         });

    //     expect(response.status).toBe(200);
    //     expect(response.body).toHaveProperty("message")
    //     expect(response.body.message).toBe('Failed to change password!');
    //     console.log(response)
    // });


    // it("Should delete authentication successfully", async () => {
    //     const response = await request(app)
    //         .delete("/api/v1/auth/delete-auth")
    //         .send({
    //             "email": test_user,
    //             "password": "1234567",
    //         });

    //     expect(response.status).toBe(200);
    // });


    // Run by using command npx jest --detectOpenHandles auth.test.js
});

// fixing it acc
describe("Test for Changing Password!", () => {
    beforeAll(async () => {
        try {
            await request(app)
                .post("/api/v1/auth/signup")
                .send({
                    email: test_user + "m",
                    password: "123456"
                });

            // // Try logging in after signing up
            // let loginResponse = await request(app)
            //     .post("/api/v1/auth/login")
            //     .send({
            //         email: test_user + "m",
            //         password: "123456"
            //     });
        } catch (error) {
            console.error("Error in beforeAll:", error);
            throw error;
        }
    });

    it("Should change password successfully", async () => {
        try {
            const response = await request(app)
                .put("/api/v1/auth/change-password")
                .send({
                    email: test_user + "m",
                    password: "123456",
                    newPassword: "1234567",
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("message");
            expect(response.body.message).toBe('Changed password successfully!');
        } catch (error) {
            console.error("Error in test 'Should change password successfully':", error);
            throw error;
        }
    });

    it("Should fail to change", async () => {
        try {
            const response = await request(app)
                .put("/api/v1/auth/change-password")
                .send({
                    email: test_user + "m",
                    password: "123456910",
                    newPassword: "1234567",
                });

            expect(response.status).toBe(404);
        } catch (error) {
            console.error("Error in test 'Should change password successfully':", error);
            throw error;
        }
    });

    it("Should delete authentication successfully", async () => {
        try {
            const response = await request(app)
                .delete("/api/v1/auth/delete-auth")
                .send({
                    email: test_user + "m",
                    password: "1234567",
                });

            expect(response.status).toBe(200);
        } catch (error) {
            console.error("Error in test 'Should delete authentication successfully':", error);
            throw error;
        }
    });
});
