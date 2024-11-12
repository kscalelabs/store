import React from "react";

import { Input, TextArea } from "@/components/ui/Input/Input";
import Spinner from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";

interface EditProfileFormProps {
  username: string;
  firstName: string;
  lastName: string;
  bio: string;
  isCheckingUsername: boolean;
  isUsernameChanged: boolean;
  isUsernameAvailable: boolean;
  usernameError: string | null;
  isSubmitting: boolean;
  setUsername: (value: string) => void;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  setBio: (value: string) => void;
  setIsEditing: (value: boolean) => void;
  handleSubmit: (event: React.FormEvent) => Promise<void>;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({
  username,
  firstName,
  lastName,
  bio,
  isCheckingUsername,
  isUsernameChanged,
  isUsernameAvailable,
  usernameError,
  isSubmitting,
  setUsername,
  setFirstName,
  setLastName,
  setBio,
  setIsEditing,
  handleSubmit,
}) => {
  return (
    <div className="flex justify-center space-y-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-4">
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-1"
          >
            Username
          </label>
          <p className="text-xs text-gray-8 italic">
            Changing your username will change the URL for all your posted
            listings.
          </p>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full"
          />
          {isCheckingUsername && (
            <p className="text-sm text-gray-500">Checking username...</p>
          )}
          {!isCheckingUsername && isUsernameChanged && (
            <p
              className={`text-sm ${
                isUsernameAvailable && !usernameError
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {usernameError ||
                (isUsernameAvailable
                  ? "Username is available"
                  : "Username is not available")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-lg font-medium">
              First Name
            </label>
            <Input
              id="first_name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 block w-full"
            />
          </div>

          <div>
            <label htmlFor="last_name" className="block text-lg font-medium">
              Last Name
            </label>
            <Input
              id="last_name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 block w-full"
            />
          </div>
        </div>

        <div>
          <label htmlFor="bio" className="block text-lg font-medium">
            Bio
          </label>
          <TextArea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-11 shadow-sm focus:border-primary-9 focus:ring focus:ring-primary-9 focus:ring-opacity-50"
            rows={3}
          />
        </div>

        {isSubmitting ? (
          <div className="mt-4 flex justify-center items-center">
            <Spinner />
          </div>
        ) : (
          <div className="mt-4 flex justify-center space-x-2">
            <Button
              type="button"
              variant="default"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={isUsernameChanged && !isUsernameAvailable}
            >
              Save Changes
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default EditProfileForm;
