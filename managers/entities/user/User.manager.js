module.exports = class User {

    constructor({ utils, cache, config, cortex, managers, validators, mongomodels } = {}) {
        this.config = config;
        this.cortex = cortex;
        this.validators = validators;
        this.mongomodels = mongomodels;
        this.tokenManager = managers.token;
        this.usersCollection = "users";
        this.httpExposed = ['createUser'];
    }

    async createUser({ username, email, password }) {
        const user = { username, email, password };

        // Data validation
        let result = await this.validators.user.createUser(user);
        if (result) return result;

        // Creation Logic
        // const UserModel = this.mongomodels.users;
        // let existing = await UserModel.findOne({ email });
        // if (existing) {
        //     return { error: "email already registered" };
        // }

        // // create in DB
        // let createdUser = await UserModel.create({
        //     username,
        //     email,
        //     password
        // });

        let longToken = this.tokenManager.genLongToken({ userId: createdUser._id, userKey: createdUser.key });

        // Response
        return {
            user,
            longToken
        };
    }


}
