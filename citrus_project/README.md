# Intelligent Citrus Leaf Disease Classification and Severity Assessment

Implementation aligned with the architecture shown in the project diagram:

Input -> Preprocessing -> Augmentation -> 70/15/15 split
-> PAM -> MFF -> 4-stage ConvNeXt -> Stage-4 Feature Enhancement
-> GAP -> FC + Softmax -> Disease Classification
-> Severity Assessment -> Agentic Crop Advisory

## Six classes used in the diagram
1. Healthy
2. Citrus Canker
3. Citrus Black Spot
4. Greening (HLB)
5. Melanose
6. Scab

## Dataset structure

Put images in:

data/
  Healthy/
  Citrus_Canker/
  Citrus_Black_Spot/
  Greening_HLB/
  Melanose/
  Scab/

The training script creates a stratified 70/15/15 train/validation/test split.

## Train

python train.py --data_dir data --epochs 30 --batch_size 16

The best model is saved to:
checkpoints/best_model.pt

## Predict

python predict.py --image path/to/leaf.jpg --checkpoint checkpoints/best_model.pt

## Web application

streamlit run app.py

## Important note about severity

The supplied architecture diagram does not contain a dedicated lesion-segmentation network. Therefore this implementation provides a baseline severity estimator using a leaf mask and abnormal-pixel/lesion heuristics. For a research-grade severity result, replace severity.py with a trained segmentation model or a calibrated lesion-area estimator.
