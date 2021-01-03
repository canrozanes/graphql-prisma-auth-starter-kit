import { gql } from "graphql-request";

export const signUpUser = gql`
  mutation($data: SignUpUserInput!) {
    signUp(data: $data) {
      message
    }
  }
`;

export const confirmEmail = gql`
  mutation($token: String!) {
    confirmEmail(token: $token) {
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

export const updateMyself = gql`
  mutation($data: UpdateMyselfInput!) {
    updateMyself(data: $data) {
      name
      email
    }
  }
`;

export const getAllUsers = gql`
  query {
    users {
      name
      email
      role
    }
  }
`;
