from pathlib import Path
import random
import shutil

from PIL import Image
from sklearn.model_selection import train_test_split


VALID_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def collect_images(data_dir):
    data_dir = Path(data_dir)
    items = []
    classes = sorted([p.name for p in data_dir.iterdir() if p.is_dir()])

    for label, cls in enumerate(classes):
        for p in (data_dir / cls).rglob("*"):
            if p.suffix.lower() in VALID_EXTS:
                items.append((str(p), label))

    if len(classes) < 2:
        raise ValueError("Need at least two class folders.")
    if not items:
        raise ValueError("No images found.")

    return items, classes


def stratified_split(items, seed=42):
    paths = [x[0] for x in items]
    labels = [x[1] for x in items]

    train_p, temp_p, train_y, temp_y = train_test_split(
        paths, labels, test_size=0.30, stratify=labels, random_state=seed
    )
    val_p, test_p, val_y, test_y = train_test_split(
        temp_p, temp_y, test_size=0.50, stratify=temp_y, random_state=seed
    )

    return (
        list(zip(train_p, train_y)),
        list(zip(val_p, val_y)),
        list(zip(test_p, test_y)),
    )
