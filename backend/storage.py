"""
Cloudflare R2 storage helper (S3-compatible).

Ce module fournit un client boto3 configuré pour Cloudflare R2. Utilisé uniquement
si tu ajoutes une fonctionnalité d'upload de fichiers (photos de mentors, CV, etc.).
Le projet actuel n'utilise pas de stockage d'objets.

Variables d'environnement requises :
    R2_ACCESS_KEY_ID
    R2_SECRET_ACCESS_KEY
    R2_BUCKET_NAME
    R2_ENDPOINT_URL  (ex : https://<accountid>.r2.cloudflarestorage.com)

Utilisation :
    from storage import get_r2_client, R2_BUCKET_NAME
    s3 = get_r2_client()
    s3.upload_fileobj(file, R2_BUCKET_NAME, "mon/objet.png")
"""
import os
from functools import lru_cache

R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID", "")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY", "")
R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME", "")
R2_ENDPOINT_URL = os.environ.get("R2_ENDPOINT_URL", "")


@lru_cache(maxsize=1)
def get_r2_client():
    """Retourne un client boto3 S3 configuré pour Cloudflare R2.

    Lève une RuntimeError si les variables d'environnement sont manquantes.
    """
    if not all([R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT_URL]):
        raise RuntimeError(
            "Configuration R2 incomplète. Renseigne R2_ACCESS_KEY_ID, "
            "R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME et R2_ENDPOINT_URL."
        )
    import boto3
    from botocore.config import Config
    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4", region_name="auto"),
    )
