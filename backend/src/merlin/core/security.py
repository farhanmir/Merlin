from cryptography.fernet import Fernet, InvalidToken


def encrypt_api_key(api_key: str, fernet_key: str) -> str:
    """
    Encrypt an API key using Fernet symmetric encryption.
    
    Args:
        api_key: The plaintext API key to encrypt
        fernet_key: The Fernet key to use for encryption
        
    Returns:
        Base64-encoded encrypted API key
    """
    f = Fernet(fernet_key.encode())
    encrypted = f.encrypt(api_key.encode())
    return encrypted.decode()


def decrypt_api_key(encrypted_key: str, fernet_key: str) -> str:
    """
    Decrypt an encrypted API key using Fernet symmetric decryption.
    
    Args:
        encrypted_key: The encrypted API key (base64-encoded)
        fernet_key: The Fernet key to use for decryption
        
    Returns:
        Decrypted plaintext API key
        
    Raises:
        ValueError: If decryption fails
    """
    try:
        f = Fernet(fernet_key.encode())
        decrypted = f.decrypt(encrypted_key.encode())
        return decrypted.decode()
    except InvalidToken as e:
        raise ValueError("Failed to decrypt API key - invalid key or corrupted data") from e
