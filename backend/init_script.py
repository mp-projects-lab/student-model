
import pandas as pd
import re


# 1.0 Set the path to the Excel file
data = "stanfordMOOCForumPostsSet.xlsx"
dataset = pd.read_excel(data)

# Display the dataset dimensions (number of rows and columns)
print(dataset.shape)

# 1.1 Remove rows with missing values in the specified columns
data_rows_cleaned = dataset.dropna(subset=['Text', 'forum_uid', 'created_at', 'CourseType'])

# Display the first five rows and dimensions of the cleaned dataset
print('Cleaned dataset:\n', data_rows_cleaned.head(), '\n', data_rows_cleaned.shape)

# 1.2 Remove duplicate rows based on the 'Text' column
data_rows_cleaned = data_rows_cleaned.drop_duplicates(subset=['forum_uid', 'Text'], keep='first')
# Display the first five rows and dimensions of the dataset after removing duplicates
print('Dataset after removing duplicates:\n', data_rows_cleaned.head(), '\n', data_rows_cleaned.shape)

# 1.3 Clean and standardize the text content
def clean_text(text):
    # Convert text to lowercase 
    text = str(text).lower() 
    # remove URLs
    text = re.sub(r'http\S+|www\S+', '', text)
    # remove HTML tags
    text = re.sub(r'<[^>]+>', ' ', text)
    # remove special characters and digits
    text = re.sub(r'_x[0-9a-fA-F]+_', ' ', text)
    # Clean escaped quotes and backslashes
    text = text.replace('\\"', '"').replace('\\', '')
    # Normalize whitespaces (turn multiple spaces/newlines into a single space)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# Apply the cleanning function to the 'Text' column
data_rows_cleaned['Processed_Text'] = data_rows_cleaned['Text'].apply(clean_text)

# 1.4 Filter out extremely short messages that lack NLP context (less than 3 words)
# Create a new column 'word_count' to store the number of words in each processed text
data_rows_cleaned['word_count'] = data_rows_cleaned['Processed_Text'].apply(lambda x: len(str(x).split()))
# Filter out rows where the word count is less than 3
data_rows_cleaned = data_rows_cleaned[data_rows_cleaned['word_count'] >= 3]
# Drop the 'word_count' column as it is no longer needed
data_rows_cleaned = data_rows_cleaned.drop(columns=['word_count'])

# Display the first five rows and dimensions of the dataset after text cleaning and filtering
print('\nDataset after text cleaning and filtering:\n', data_rows_cleaned[['Text', 'Processed_Text']].head(), '\n', data_rows_cleaned.shape)