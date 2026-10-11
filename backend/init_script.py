
import pandas as pd

# Set the path to the Excel file
data = "stanfordMOOCForumPostsSet.xlsx"
dataset = pd.read_excel(data)

# Display the dataset dimensions (number of rows and columns)
print(dataset.shape)

# Remove rows with missing values in the specified columns
data_rows_cleaned = dataset.dropna(subset=['Text', 'forum_uid', 'created_at', 'CourseType'])

# Display the first five rows and dimensions of the cleaned dataset
print('Cleaned dataset:\n', data_rows_cleaned.head(), '\n', data_rows_cleaned.shape)
