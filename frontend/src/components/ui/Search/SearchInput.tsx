import * as React from "react";
import { Search } from "react-bootstrap-icons";
import { Input } from "../Input/Input";
import styles from "./SearchInput.module.css";

export interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  userInput?: string;
  onSearch?: (query: string) => void;
}

const SearchInput = ({
  className,
  userInput,
  onChange,
  onSearch,
}: SearchInputProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearch && userInput !== undefined) {
      onSearch(userInput); // Trigger a new callback onSearch
    }
  };
  return (
    <div className={`${styles.SearchInput} ${className}`}>
      <Search className={styles.Icon} />
      <Input
        type="search"
        placeholder="Search..."
        className={styles.Input}
        value={userInput}
        onChange={onChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

SearchInput.displayName = "SearchInput";

export { SearchInput };
