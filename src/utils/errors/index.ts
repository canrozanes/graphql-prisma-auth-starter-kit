import { ApolloError } from "apollo-server";

const RESOURCE_NOT_FOUND_STATUS_CODE = "404";

export class NotFoundError extends ApolloError {
  constructor(message: string) {
    super(message, RESOURCE_NOT_FOUND_STATUS_CODE);
  }
}

export {
  UserInputError,
  AuthenticationError,
  ForbiddenError,
  ApolloError,
} from "apollo-server";
