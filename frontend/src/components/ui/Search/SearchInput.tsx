import * as React from "react"
import styles from "./SearchInput.module.css"
import { Input } from "../Input/Input"
import { Search } from 'react-bootstrap-icons'

export interface SearchInputProps
    extends React.HTMLAttributes<HTMLInputElement> { }

const SearchInput = ({ className }: SearchInputProps) => {
    return (
        <div className={`${styles.SearchInput} ${className}`}>
            <Search className={styles.Icon} />
            <Input
                type="search"
                placeholder="Search..."
                className={styles.Input}
            />
        </div>
    );
};


SearchInput.displayName = "SearchInput"

export { SearchInput }
