# import cv2
# import numpy as np
# from PIL import Image
#
#
# SEVERITY_LEVELS = [
#     ("Mild", 0, 25),
#     ("Moderate", 26, 50),
#     ("Severe", 51, 75),
#     ("Critical", 76, 100),
# ]
#
#
# def estimate_severity(image_path):
#     """
#     Baseline image-based severity estimator.
#
#     It first estimates the leaf region using HSV green pixels, then
#     measures non-green pixels inside that region as a rough lesion/
#     discoloration ratio.
#
#     This is a baseline, NOT a medically/agronomically validated
#     lesion-segmentation method.
#     """
#     img = np.array(Image.open(image_path).convert("RGB"))
#     hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV)
#
#     # Broad green leaf mask
#     lower = np.array([20, 30, 20], dtype=np.uint8)
#     upper = np.array([100, 255, 255], dtype=np.uint8)
#     leaf_mask = cv2.inRange(hsv, lower, upper)
#
#     kernel = np.ones((5, 5), np.uint8)
#     leaf_mask = cv2.morphologyEx(leaf_mask, cv2.MORPH_CLOSE, kernel)
#     leaf_mask = cv2.morphologyEx(leaf_mask, cv2.MORPH_OPEN, kernel)
#
#     leaf_pixels = leaf_mask > 0
#     if leaf_pixels.sum() == 0:
#         return {
#             "severity": "Unknown",
#             "percentage": None,
#             "reason": "Leaf region could not be reliably detected."
#         }
#
#     # Detect strong yellow/brown/dark discoloration.
#     h, s, v = cv2.split(hsv)
#     lesion = (
#         (((h >= 8) & (h <= 40)) & (s > 70) & (v < 220)) |
#         ((v < 75) & (s > 40))
#     )
#
#     affected = lesion & leaf_pixels
#     ratio = 100.0 * affected.sum() / leaf_pixels.sum()
#
#     # Clamp to 0..100 for the displayed severity scale.
#     percentage = float(np.clip(ratio, 0, 100))
#
#     if percentage <= 25:
#         level = "Mild"
#     elif percentage <= 50:
#         level = "Moderate"
#     elif percentage <= 75:
#         level = "Severe"
#     else:
#         level = "Critical"
#
#     return {
#         "severity": level,
#         "percentage": round(percentage, 2),
#         "reason": "Estimated from affected/discolored pixels inside the detected leaf region."
#     }

# another way

import cv2
import numpy as np
from PIL import Image


def estimate_severity(image_path, save_visualization=True):
    """
    Estimate citrus leaf disease severity using pixel-based analysis.

    Formula:

        Affected Area (%) =
            Affected Leaf Pixels / Total Leaf Pixels * 100

    NOTE:
    This is an image-processing based baseline.
    For research-grade severity assessment, a trained lesion
    segmentation model should be used.
    """

    # =========================================================
    # 1. READ IMAGE
    # =========================================================

    image = np.array(
        Image.open(image_path).convert("RGB")
    )

    # OpenCV uses BGR internally
    bgr = cv2.cvtColor(
        image,
        cv2.COLOR_RGB2BGR
    )

    hsv = cv2.cvtColor(
        bgr,
        cv2.COLOR_BGR2HSV
    )

    h, s, v = cv2.split(hsv)

    # =========================================================
    # 2. CREATE LEAF MASK
    # =========================================================

    # Green vegetation mask
    green_mask = (
        (h >= 20) &
        (h <= 100) &
        (s >= 35) &
        (v >= 30)
    )

    # Additional vegetation pixels with strong saturation
    colored_mask = (
        (s >= 45) &
        (v >= 40)
    )

    # Combine
    leaf_mask = green_mask | colored_mask

    leaf_mask = (
        leaf_mask.astype(np.uint8) * 255
    )

    # =========================================================
    # 3. CLEAN LEAF MASK
    # =========================================================

    kernel = np.ones(
        (7, 7),
        np.uint8
    )

    leaf_mask = cv2.morphologyEx(
        leaf_mask,
        cv2.MORPH_CLOSE,
        kernel
    )

    leaf_mask = cv2.morphologyEx(
        leaf_mask,
        cv2.MORPH_OPEN,
        kernel
    )

    # Keep the largest connected region
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(
        leaf_mask,
        connectivity=8
    )

    if num_labels > 1:

        largest_label = 1 + np.argmax(
            stats[1:, cv2.CC_STAT_AREA]
        )

        leaf_mask = np.where(
            labels == largest_label,
            255,
            0
        ).astype(np.uint8)

    # =========================================================
    # 4. TOTAL LEAF PIXELS
    # =========================================================

    total_leaf_pixels = int(
        np.sum(leaf_mask > 0)
    )

    if total_leaf_pixels == 0:

        return {
            "severity": "Unknown",
            "percentage": None,
            "total_leaf_pixels": 0,
            "affected_pixels": 0,
            "reason": "Leaf region could not be detected."
        }

    # =========================================================
    # 5. DETECT POSSIBLE DISEASE / LESION PIXELS
    # =========================================================

    # Brown / orange / yellow discoloration
    brown_yellow = (
        (h >= 5) &
        (h <= 45) &
        (s >= 45) &
        (v <= 230)
    )

    # Dark necrotic regions
    dark_regions = (
        (v < 90) &
        (s > 35)
    )

    # Yellowing / chlorotic regions
    yellow_regions = (
        (h >= 20) &
        (h <= 40) &
        (s >= 50) &
        (v >= 80)
    )

    # Combine possible lesion regions
    lesion_mask = (
        brown_yellow |
        dark_regions |
        yellow_regions
    )

    # Only count lesions INSIDE the leaf
    affected_mask = (
        lesion_mask &
        (leaf_mask > 0)
    )

    # =========================================================
    # 6. REMOVE VERY SMALL NOISE
    # =========================================================

    affected_mask_uint8 = (
        affected_mask.astype(np.uint8) * 255
    )

    small_kernel = np.ones(
        (3, 3),
        np.uint8
    )

    affected_mask_uint8 = cv2.morphologyEx(
        affected_mask_uint8,
        cv2.MORPH_OPEN,
        small_kernel
    )

    affected_mask_uint8 = cv2.morphologyEx(
        affected_mask_uint8,
        cv2.MORPH_CLOSE,
        small_kernel
    )

    affected_mask = (
        affected_mask_uint8 > 0
    )

    # =========================================================
    # 7. COUNT AFFECTED PIXELS
    # =========================================================

    affected_pixels = int(
        np.sum(affected_mask)
    )

    # =========================================================
    # 8. CALCULATE AFFECTED AREA
    # =========================================================

    affected_percentage = (
        affected_pixels /
        total_leaf_pixels
    ) * 100

    # Safety clamp
    affected_percentage = float(
        np.clip(
            affected_percentage,
            0,
            100
        )
    )

    # =========================================================
    # 9. SEVERITY CLASSIFICATION
    # =========================================================

    if affected_percentage < 25:
        severity = "Mild"

    elif affected_percentage < 50:
        severity = "Moderate"

    elif affected_percentage < 75:
        severity = "Severe"

    else:
        severity = "Critical"

    # =========================================================
    # 10. OPTIONAL VISUALIZATION
    # =========================================================

    if save_visualization:

        # Create visualization
        visualization = image.copy()

        # Highlight affected pixels in red
        visualization[affected_mask] = [
            255,
            0,
            0
        ]

        output_path = "severity_analysis.png"

        Image.fromarray(
            visualization
        ).save(output_path)

    # =========================================================
    # 11. RETURN RESULTS
    # =========================================================

    return {

        "severity": severity,

        "percentage": round(
            affected_percentage,
            2
        ),

        "total_leaf_pixels": total_leaf_pixels,

        "affected_pixels": affected_pixels,

        "reason":
            "Severity calculated from the ratio of affected "
            "pixels to total leaf pixels."
    }
