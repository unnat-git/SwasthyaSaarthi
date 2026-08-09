import joblib
import pickle
import os
import sys

# Custom unpickler to handle sklearn version compatibility if needed
class CompatibilityUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if module == 'sklearn.compose._column_transformer' and name == '_RemainderColsList':
            return list
        return super().find_class(module, name)

models = [
    'diabetes_xgboost_final.pkl',
    'final_xgboost_cvd_model.pkl',
    'hypertension_xgb_model.pkl'
]

base_dir = r'c:\Users\rajun\Desktop\swastai\temp_swasthya_saarthi'

for name in models:
    path = os.path.join(base_dir, name)
    print('='*60)
    print('FILE:', name)
    data = None
    try:
        data = joblib.load(path)
        print('Loaded via joblib, type:', type(data))
    except Exception as e:
        print('joblib error:', e)
        try:
            with open(path, 'rb') as f:
                data = CompatibilityUnpickler(f).load()
            print('Loaded via CompatibilityUnpickler, type:', type(data))
        except Exception as e2:
            print('CompatibilityUnpickler error:', e2)

    if data is None:
        continue

    print('DATA TYPE:', type(data))
    if isinstance(data, dict):
        print('Dict Keys:', list(data.keys()))
        for k, v in data.items():
            print(f'  Key [{k}]: type={type(v)}')
            if hasattr(v, 'feature_names_in_'):
                print(f'    feature_names_in_ ({len(v.feature_names_in_)}):', list(v.feature_names_in_))
            if hasattr(v, 'get_booster'):
                try:
                    fn = v.get_booster().feature_names
                    print(f'    booster feature_names:', fn)
                except Exception as ex:
                    print(f'    booster error:', ex)
    else:
        if hasattr(data, 'feature_names_in_'):
            print(f'  feature_names_in_ ({len(data.feature_names_in_)}):', list(data.feature_names_in_))
        if hasattr(data, 'get_booster'):
            try:
                fn = data.get_booster().feature_names
                print(f'  booster feature_names:', fn)
                print(f'  booster num_features:', data.get_booster().num_features())
            except Exception as ex:
                print('  booster feature_names error:', ex)
        if hasattr(data, 'n_features_in_'):
            print(f'  n_features_in_:', data.n_features_in_)
        if hasattr(data, 'named_steps'):
            print('  Pipeline steps:', data.named_steps)
        if hasattr(data, 'feature_importances_'):
            print('  feature_importances_:', data.feature_importances_)
        if isinstance(data, (list, tuple)):
            print('  Length:', len(data))
            for i, item in enumerate(data):
                print(f'   Item {i}: type={type(item)}, val={str(item)[:200]}')
