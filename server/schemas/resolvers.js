const { User } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id })
          .select('-__v -password');
        return userData;
      }
      throw new AuthenticationError('Not logged in');
    },
    users: async () => {
      return User.find()
        .select('-__v')
        .populate('savedBooks')
    }
  },
  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);

      return { token, user };
    },
    // destructure email/password from args obj
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('Wrong username/password');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Wrong username/password');
      }

      const token = signToken(user);
      console.log(user);
      return { token, user };
    },

    saveBook: async (parent, { input }, context) => {
      if (context.user) {
        const savedBook = await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: input } },
          { new: true }
        )
        console.log(context.user);
        return savedBook;
      }

      throw new AuthenticationError('You need to be logged in');
    },

    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const removedBook = await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks:{ bookId }} },
          { new: true }
        );

        return removedBook;
      }

      throw new AuthenticationError('You need to be logged in');
    }
  }
}

module.exports = resolvers;