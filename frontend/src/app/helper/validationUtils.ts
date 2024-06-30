type RegisterProps = {
  name: string;
  email: string;
  password: string;
  passConfirmation: string;
};

type LoginProps = {
  email: string;
  password: string;
};

// Function to check if the values entered in the registration form are valid
export const checkRegisterValidation = ({
  name,
  email,
  password,
  passConfirmation,
}: RegisterProps) => {
  // If the values are null, return false.
  if (!name || !email || !password || !passConfirmation) {
    alert("Please fill in all fields"); // Set alert message temporarily.
    return false;
  }

  // TODO: Check if the number of characters in the name is less than XX, return false.

  // If the email is not in the correct format, return false.
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    alert("Please enter a valid email address"); // Set alert message temporarily.
    return false;
  }

  // TODO: Check if the number of characters in the password is less than XX, return false.

  // If values of password and password confirmation is different, return false.
  if (password !== passConfirmation) {
    alert("Password and password confirmation do not match"); // Set alert message temporarily.
    return false;
  }

  return true;
};

// Function to check if the values entered in the login form are valid
export const checkLoginValidation = ({ email, password }: LoginProps) => {
  // If the values are null, return false.
  if (!email || !password) {
    alert("Please fill in both fields"); // Set alert message temporarily.
    return false;
  }

  // If the email is not in the correct format, return false.
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    alert("Please enter a valid email address"); // Set alert message temporarily.
    return false;
  }

  return true;
};
