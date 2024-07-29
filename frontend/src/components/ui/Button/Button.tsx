import styles from "./Button.module.css";

interface ButtonPros {
  children: React.ReactNode;
}
const Button = ({ children }: ButtonPros) => {
  return (
    <button type="button" className={`${styles.buttonStyle}`}>
      {children}
    </button>
  );
};

export default Button;
