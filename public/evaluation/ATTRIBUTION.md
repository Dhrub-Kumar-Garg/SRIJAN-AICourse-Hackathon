# Srijan evaluation photographs

99 real source-labelled photographs selected from **RealWaste**, Single, S.; Iranmanesh, S.; Raad, R. (2023), UCI Machine Learning Repository, DOI [10.24432/C5SS4G](https://doi.org/10.24432/C5SS4G).

Source: https://archive.ics.uci.edu/dataset/908/realwaste

The UCI distribution lists **Creative Commons Attribution 4.0 International**: https://creativecommons.org/licenses/by/4.0/ . Photographs are copied unchanged, with filenames renamed. Original paths, labels and SHA-256 hashes are in the application manifest and downloadable report.

Licensing discrepancy: the original authors' repository (https://github.com/sam-single/realwaste) lists **CC BY-NC-SA 4.0**, https://creativecommons.org/licenses/by-nc-sa/4.0/ . This benchmark uses the UCI-distributed copy and records both notices. Retain attribution and these notices when redistributing; resolve the upstream discrepancy before commercial reuse.

Selection: sort source paths by SHA-256 of `srijan-eval-v1:` followed by the path; take 14 per app category, plus one additional plastic photo, excluding duplicate bytes. This selection was fixed before inference. Paper combines Cardboard/Paper, Organic combines Food Organics/Vegetation. Miscellaneous Trash maps to Residual, Textile Trash to Textile; Glass/Metal/Plastic retain their material labels.

These are dataset-author labels, not independently re-annotated municipal disposal advice. No photographs are generated, and no labels are inferred by our model. E-waste and hazardous waste have no samples and remain **untested**. The 99 images are a small public benchmark, not a training set, independent validation set, or a claim about local real-world accuracy. No model training or fine-tuning was performed. Treat contamination, mixed materials, reuse suitability and local rules separately.
