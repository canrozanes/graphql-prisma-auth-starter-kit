import { gql } from "graphql-request";

export const signUpUser = gql`
  mutation($data: SignUpUserInput!) {
    signUp(data: $data) {
      message
    }
  }
`;

export const activateUser = gql`
  mutation($token: String!) {
    activateUser(token: $token) {
      message
    }
  }
`;

export const forgotPassword = gql`
  mutation($email: String!) {
    forgotPassword(email: $email) {
      message
    }
  }
`;

export const resetPassword = gql`
  mutation($data: ResetPasswordInput!) {
    resetPassword(data: $data) {
      message
    }
  }
`;

export const login = gql`
  mutation($data: LoginUserInput!) {
    login(data: $data) {
      user {
        name
        email
      }
      token
    }
  }
`;

export const me = gql`
  query {
    me {
      name
      email
    }
  }
`;

export const updateUser = gql`
  mutation($data: UpdateUserInput!) {
    updateUser(data: $data) {
      name
      email
    }
  }
`;
