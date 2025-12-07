#!/usr/bin/env python3
"""
Real-time ML Anomaly Detection - Production-grade machine learning for bridge security
"""

import logging
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any

import joblib
import lightgbm as lgb
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.cluster import DBSCAN

# Machine Learning libraries
from sklearn.ensemble import IsolationForest
from sklearn.metrics import (
    roc_auc_score,
)
from sklearn.preprocessing import RobustScaler, StandardScaler
from sklearn.svm import OneClassSVM
from tensorflow import keras
from tensorflow.keras import layers

logger = logging.getLogger(__name__)


class AnomalyType(str, Enum):
    """Types of anomalies detected by ML models"""

    STATISTICAL_OUTLIER = "statistical_outlier"
    PATTERN_ANOMALY = "pattern_anomaly"
    BEHAVIORAL_ANOMALY = "behavioral_anomaly"
    TEMPORAL_ANOMALY = "temporal_anomaly"
    CLUSTER_ANOMALY = "cluster_anomaly"
    SEQUENCE_ANOMALY = "sequence_anomaly"
    MULTIVARIATE_ANOMALY = "multivariate_anomaly"


class ModelType(str, Enum):
    """Types of ML models"""

    ISOLATION_FOREST = "isolation_forest"
    ONE_CLASS_SVM = "one_class_svm"
    DBSCAN = "dbscan"
    LSTM_AUTOENCODER = "lstm_autoencoder"
    TRANSFORMER = "transformer"
    XGBOOST = "xgboost"
    LIGHTGBM = "lightgbm"
    NEURAL_NETWORK = "neural_network"
    ENSEMBLE = "ensemble"


@dataclass
class AnomalyDetection:
    """ML anomaly detection result"""

    anomaly_id: str
    anomaly_type: AnomalyType
    model_type: ModelType
    confidence: float
    severity: str
    features: dict[str, float]
    explanation: str
    recommendations: list[str]
    timestamp: datetime
    metadata: dict[str, Any]


@dataclass
class ModelPerformance:
    """ML model performance metrics"""

    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    auc_roc: float
    false_positive_rate: float
    false_negative_rate: float
    training_time: float
    prediction_time: float
    last_updated: datetime


class MLAnomalyDetector:
    """Production-grade ML anomaly detection system"""

    def __init__(self):
        self.models: dict[str, Any] = {}
        self.scalers: dict[str, Any] = {}
        self.feature_encoders: dict[str, Any] = {}
        self.performance_metrics: dict[str, ModelPerformance] = {}
        self.training_data: dict[str, deque] = defaultdict(lambda: deque(maxlen=100000))
        self.anomaly_history: deque = deque(maxlen=100000)

        # Model configuration
        self.model_configs = {
            ModelType.ISOLATION_FOREST: {
                "contamination": 0.1,
                "random_state": 42,
                "n_estimators": 100,
            },
            ModelType.ONE_CLASS_SVM: {"nu": 0.1, "kernel": "rbf", "gamma": "scale"},
            ModelType.DBSCAN: {"eps": 0.5, "min_samples": 5},
            ModelType.XGBOOST: {
                "n_estimators": 100,
                "max_depth": 6,
                "learning_rate": 0.1,
                "random_state": 42,
            },
            ModelType.LIGHTGBM: {
                "n_estimators": 100,
                "max_depth": 6,
                "learning_rate": 0.1,
                "random_state": 42,
            },
        }

        # Feature engineering configuration
        self.feature_config = {
            "temporal_features": ["hour", "day_of_week", "month", "is_weekend"],
            "transaction_features": ["value", "gas_price", "gas_used", "nonce"],
            "network_features": ["block_time", "block_size", "transaction_count"],
            "behavioral_features": ["frequency", "amount_variance", "time_variance"],
        }

        # Initialize models
        self._initialize_models()

        logger.info("MLAnomalyDetector initialized")

    def _initialize_models(self):
        """Initialize ML models"""
        for model_type in ModelType:
            if model_type == ModelType.ISOLATION_FOREST:
                self.models[model_type.value] = IsolationForest(**self.model_configs[model_type])
            elif model_type == ModelType.ONE_CLASS_SVM:
                self.models[model_type.value] = OneClassSVM(**self.model_configs[model_type])
            elif model_type == ModelType.DBSCAN:
                self.models[model_type.value] = DBSCAN(**self.model_configs[model_type])
            elif model_type == ModelType.XGBOOST:
                self.models[model_type.value] = xgb.XGBClassifier(**self.model_configs[model_type])
            elif model_type == ModelType.LIGHTGBM:
                self.models[model_type.value] = lgb.LGBMClassifier(**self.model_configs[model_type])
            elif model_type == ModelType.NEURAL_NETWORK:
                self.models[model_type.value] = self._create_neural_network()
            elif model_type == ModelType.LSTM_AUTOENCODER:
                self.models[model_type.value] = self._create_lstm_autoencoder()
            elif model_type == ModelType.TRANSFORMER:
                self.models[model_type.value] = self._create_transformer()
            elif model_type == ModelType.ENSEMBLE:
                self.models[model_type.value] = self._create_ensemble_model()

        # Initialize scalers
        self.scalers["standard"] = StandardScaler()
        self.scalers["robust"] = RobustScaler()

        logger.info(f"Initialized {len(self.models)} ML models")

    def _create_neural_network(self):
        """Create neural network model"""
        # Define input shape based on feature count (14 features)
        input_shape = (14,)

        model = keras.Sequential(
            [
                layers.Dense(128, activation="relu", input_shape=input_shape),
                layers.Dropout(0.3),
                layers.Dense(64, activation="relu"),
                layers.Dropout(0.3),
                layers.Dense(32, activation="relu"),
                layers.Dropout(0.3),
                layers.Dense(1, activation="sigmoid"),
            ]
        )

        model.compile(
            optimizer="adam",
            loss="binary_crossentropy",
            metrics=["accuracy", "precision", "recall"],
        )

        return model

    def _create_lstm_autoencoder(self):
        """Create LSTM autoencoder for sequence anomaly detection"""
        # Define sequence length and features
        sequence_length = 10
        n_features = 1

        input_layer = layers.Input(shape=(sequence_length, n_features))

        # Encoder
        encoder = layers.LSTM(64, return_sequences=True)(input_layer)
        encoder = layers.LSTM(32, return_sequences=False)(encoder)
        encoder = layers.Dense(16, activation="relu")(encoder)

        # Decoder
        decoder = layers.RepeatVector(sequence_length)(encoder)
        decoder = layers.LSTM(32, return_sequences=True)(decoder)
        decoder = layers.LSTM(64, return_sequences=True)(decoder)
        decoder = layers.TimeDistributed(layers.Dense(n_features))(decoder)

        autoencoder = keras.Model(input_layer, decoder)
        autoencoder.compile(optimizer="adam", loss="mse")

        return autoencoder

    def _create_transformer(self):
        """Create transformer model for sequence analysis"""
        # Simplified transformer implementation
        # In production, use a more sophisticated transformer architecture
        model = keras.Sequential(
            [
                layers.Dense(128, activation="relu"),
                layers.LayerNormalization(),
                layers.Dense(64, activation="relu"),
                layers.LayerNormalization(),
                layers.Dense(1, activation="sigmoid"),
            ]
        )

        model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])

        return model

    def _create_ensemble_model(self):
        """Create ensemble model combining multiple algorithms"""
        from sklearn.ensemble import VotingClassifier

        # Create base models
        base_models = [
            ("isolation_forest", self.models[ModelType.ISOLATION_FOREST.value]),
            ("one_class_svm", self.models[ModelType.ONE_CLASS_SVM.value]),
            ("xgboost", self.models[ModelType.XGBOOST.value]),
        ]

        return VotingClassifier(base_models, voting="soft")

    async def train_model(
        self, model_type: ModelType, training_data: list[dict[str, Any]], labels: list[int] = None
    ) -> ModelPerformance:
        """Train ML model with real data"""
        start_time = time.time()

        try:
            # Prepare features
            X, y = self._prepare_training_data(training_data, labels)

            if X is None or len(X) == 0:
                raise ValueError("No valid training data provided")

            # Scale features
            X_scaled = self.scalers["standard"].fit_transform(X)

            # Train model
            model = self.models[model_type.value]

            if model_type in [
                ModelType.ISOLATION_FOREST,
                ModelType.ONE_CLASS_SVM,
                ModelType.DBSCAN,
            ]:
                # Unsupervised models
                model.fit(X_scaled)
            else:
                # Supervised models
                if y is None:
                    raise ValueError(f"Labels required for supervised model: {model_type}")
                model.fit(X_scaled, y)

            # Evaluate model
            performance = await self._evaluate_model(model, X_scaled, y, model_type)
            performance.training_time = time.time() - start_time

            # Store performance metrics
            self.performance_metrics[model_type.value] = performance

            logger.info(f"Trained {model_type.value} model in {performance.training_time:.2f}s")
            return performance

        except Exception as e:
            logger.error(f"Error training {model_type.value} model: {e}")
            raise

    def _prepare_training_data(
        self, data: list[dict[str, Any]], labels: list[int] = None
    ) -> tuple[np.ndarray, np.ndarray]:
        """Prepare training data for ML models"""
        if not data:
            return None, None

        # Convert to DataFrame
        df = pd.DataFrame(data)

        # Extract features
        features = []
        for _, row in df.iterrows():
            feature_vector = self._extract_features(row)
            features.append(feature_vector)

        X = np.array(features)
        y = np.array(labels) if labels else None

        return X, y

    def _extract_features(self, data: dict[str, Any]) -> list[float]:
        """Extract features from data point"""
        features = []

        # Temporal features
        if "timestamp" in data:
            timestamp = pd.to_datetime(data["timestamp"])
            features.extend(
                [
                    timestamp.hour,
                    timestamp.day_of_week,
                    timestamp.month,
                    1 if timestamp.weekday() >= 5 else 0,  # is_weekend
                ]
            )
        else:
            features.extend([0, 0, 0, 0])

        # Transaction features
        features.extend(
            [
                data.get("value", 0),
                data.get("gas_price", 0),
                data.get("gas_used", 0),
                data.get("nonce", 0),
            ]
        )

        # Network features
        features.extend(
            [data.get("block_time", 0), data.get("block_size", 0), data.get("transaction_count", 0)]
        )

        # Behavioral features
        features.extend(
            [data.get("frequency", 0), data.get("amount_variance", 0), data.get("time_variance", 0)]
        )

        return features

    async def _evaluate_model(
        self, model, X: np.ndarray, y: np.ndarray, model_type: ModelType
    ) -> ModelPerformance:
        """Evaluate model performance"""
        start_time = time.time()

        try:
            if model_type in [
                ModelType.ISOLATION_FOREST,
                ModelType.ONE_CLASS_SVM,
                ModelType.DBSCAN,
            ]:
                # Unsupervised evaluation
                predictions = model.predict(X)
                anomaly_scores = (
                    model.decision_function(X)
                    if hasattr(model, "decision_function")
                    else predictions
                )

                # Convert to binary predictions (1 = normal, -1 = anomaly)
                binary_predictions = np.where(predictions == 1, 0, 1)

                # Calculate metrics
                if y is not None:
                    accuracy = np.mean(binary_predictions == y)
                    precision = self._calculate_precision(binary_predictions, y)
                    recall = self._calculate_recall(binary_predictions, y)
                    f1_score = (
                        2 * (precision * recall) / (precision + recall)
                        if (precision + recall) > 0
                        else 0
                    )
                    auc_roc = roc_auc_score(y, anomaly_scores) if len(np.unique(y)) > 1 else 0.5
                else:
                    accuracy = precision = recall = f1_score = auc_roc = 0.0

                false_positive_rate = (
                    self._calculate_fpr(binary_predictions, y) if y is not None else 0.0
                )
                false_negative_rate = (
                    self._calculate_fnr(binary_predictions, y) if y is not None else 0.0
                )

            else:
                # Supervised evaluation
                if y is None:
                    raise ValueError("Labels required for supervised evaluation")

                predictions = model.predict(X)
                prediction_proba = (
                    model.predict_proba(X)[:, 1] if hasattr(model, "predict_proba") else predictions
                )

                accuracy = np.mean(predictions == y)
                precision = self._calculate_precision(predictions, y)
                recall = self._calculate_recall(predictions, y)
                f1_score = (
                    2 * (precision * recall) / (precision + recall)
                    if (precision + recall) > 0
                    else 0
                )
                auc_roc = roc_auc_score(y, prediction_proba) if len(np.unique(y)) > 1 else 0.5
                false_positive_rate = self._calculate_fpr(predictions, y)
                false_negative_rate = self._calculate_fnr(predictions, y)

            prediction_time = time.time() - start_time

            return ModelPerformance(
                model_name=model_type.value,
                accuracy=accuracy,
                precision=precision,
                recall=recall,
                f1_score=f1_score,
                auc_roc=auc_roc,
                false_positive_rate=false_positive_rate,
                false_negative_rate=false_negative_rate,
                training_time=0.0,  # Will be set by caller
                prediction_time=prediction_time,
                last_updated=datetime.utcnow(),
            )

        except Exception as e:
            logger.error(f"Error evaluating model: {e}")
            return ModelPerformance(
                model_name=model_type.value,
                accuracy=0.0,
                precision=0.0,
                recall=0.0,
                f1_score=0.0,
                auc_roc=0.0,
                false_positive_rate=0.0,
                false_negative_rate=0.0,
                training_time=0.0,
                prediction_time=0.0,
                last_updated=datetime.utcnow(),
            )

    def _calculate_precision(self, predictions: np.ndarray, labels: np.ndarray) -> float:
        """Calculate precision"""
        tp = np.sum((predictions == 1) & (labels == 1))
        fp = np.sum((predictions == 1) & (labels == 0))
        return tp / (tp + fp) if (tp + fp) > 0 else 0.0

    def _calculate_recall(self, predictions: np.ndarray, labels: np.ndarray) -> float:
        """Calculate recall"""
        tp = np.sum((predictions == 1) & (labels == 1))
        fn = np.sum((predictions == 0) & (labels == 1))
        return tp / (tp + fn) if (tp + fn) > 0 else 0.0

    def _calculate_fpr(self, predictions: np.ndarray, labels: np.ndarray) -> float:
        """Calculate false positive rate"""
        fp = np.sum((predictions == 1) & (labels == 0))
        tn = np.sum((predictions == 0) & (labels == 0))
        return fp / (fp + tn) if (fp + tn) > 0 else 0.0

    def _calculate_fnr(self, predictions: np.ndarray, labels: np.ndarray) -> float:
        """Calculate false negative rate"""
        fn = np.sum((predictions == 0) & (labels == 1))
        tp = np.sum((predictions == 1) & (labels == 1))
        return fn / (fn + tp) if (fn + tp) > 0 else 0.0

    async def detect_anomaly(
        self, data: dict[str, Any], model_type: ModelType = None
    ) -> list[AnomalyDetection]:
        """Detect anomalies using ML models"""
        detections = []

        try:
            # Extract features
            features = self._extract_features(data)
            X = np.array([features])

            # Scale features
            X_scaled = self.scalers["standard"].transform(X)

            # Use specific model or ensemble
            if model_type:
                models_to_use = [model_type.value]
            else:
                models_to_use = [m for m in self.models.keys() if m != ModelType.ENSEMBLE.value]

            for model_name in models_to_use:
                if model_name not in self.models:
                    continue

                model = self.models[model_name]

                try:
                    # Get prediction
                    if model_name in [
                        ModelType.ISOLATION_FOREST.value,
                        ModelType.ONE_CLASS_SVM.value,
                    ]:
                        prediction = model.predict(X_scaled)[0]
                        anomaly_score = (
                            model.decision_function(X_scaled)[0]
                            if hasattr(model, "decision_function")
                            else prediction
                        )
                        is_anomaly = prediction == -1
                    elif model_name == ModelType.DBSCAN.value:
                        prediction = model.fit_predict(X_scaled)[0]
                        is_anomaly = prediction == -1
                        anomaly_score = -1.0 if is_anomaly else 1.0
                    else:
                        prediction = model.predict(X_scaled)[0]
                        prediction_proba = (
                            model.predict_proba(X_scaled)[0][1]
                            if hasattr(model, "predict_proba")
                            else prediction
                        )
                        is_anomaly = prediction == 1
                        anomaly_score = prediction_proba

                    if is_anomaly:
                        # Create anomaly detection result
                        detection = AnomalyDetection(
                            anomaly_id=f"ml_{model_name}_{int(time.time())}",
                            anomaly_type=self._classify_anomaly_type(features, model_name),
                            model_type=ModelType(model_name),
                            confidence=abs(anomaly_score),
                            severity=self._determine_severity(abs(anomaly_score)),
                            features=dict(zip(self._get_feature_names(), features, strict=False)),
                            explanation=self._generate_explanation(
                                features, model_name, anomaly_score
                            ),
                            recommendations=self._generate_recommendations(features, model_name),
                            timestamp=datetime.utcnow(),
                            metadata={
                                "model_name": model_name,
                                "anomaly_score": anomaly_score,
                                "prediction": prediction,
                            },
                        )

                        detections.append(detection)
                        self.anomaly_history.append(detection)

                except Exception as e:
                    logger.warning(f"Error detecting anomaly with {model_name}: {e}")
                    continue

            return detections

        except Exception as e:
            logger.error(f"Error in anomaly detection: {e}")
            return []

    def _classify_anomaly_type(self, features: list[float], model_name: str) -> AnomalyType:
        """Classify anomaly type based on features and model"""
        # Simple classification based on feature patterns
        # In production, use more sophisticated classification

        if model_name in [ModelType.ISOLATION_FOREST.value, ModelType.ONE_CLASS_SVM.value]:
            return AnomalyType.STATISTICAL_OUTLIER
        if model_name == ModelType.DBSCAN.value:
            return AnomalyType.CLUSTER_ANOMALY
        if model_name in [ModelType.LSTM_AUTOENCODER.value, ModelType.TRANSFORMER.value]:
            return AnomalyType.SEQUENCE_ANOMALY
        return AnomalyType.MULTIVARIATE_ANOMALY

    def _determine_severity(self, confidence: float) -> str:
        """Determine anomaly severity based on confidence"""
        if confidence >= 0.9:
            return "critical"
        if confidence >= 0.7:
            return "high"
        if confidence >= 0.5:
            return "medium"
        return "low"

    def _generate_explanation(
        self, features: list[float], model_name: str, anomaly_score: float
    ) -> str:
        """Generate human-readable explanation of anomaly"""
        feature_names = self._get_feature_names()
        top_features = sorted(
            zip(feature_names, features, strict=False), key=lambda x: abs(x[1]), reverse=True
        )[:3]

        explanation = f"Anomaly detected by {model_name} model (score: {anomaly_score:.3f}). "
        explanation += f"Top contributing features: {', '.join([f'{name}={value:.3f}' for name, value in top_features])}"

        return explanation

    def _generate_recommendations(self, features: list[float], model_name: str) -> list[str]:
        """Generate recommendations based on anomaly"""
        recommendations = []

        # Check for specific patterns
        if features[0] > 20:  # High value transaction
            recommendations.append("Review high-value transaction for potential fraud")

        if features[1] > 100:  # High gas price
            recommendations.append("Investigate high gas price - potential MEV activity")

        if features[2] > 100000:  # High gas used
            recommendations.append("Check for complex contract interactions")

        # General recommendations
        recommendations.extend(
            [
                "Review transaction patterns and timing",
                "Verify transaction authenticity",
                "Check for coordinated behavior",
            ]
        )

        return recommendations

    def _get_feature_names(self) -> list[str]:
        """Get feature names for explanation"""
        return [
            "hour",
            "day_of_week",
            "month",
            "is_weekend",
            "value",
            "gas_price",
            "gas_used",
            "nonce",
            "block_time",
            "block_size",
            "transaction_count",
            "frequency",
            "amount_variance",
            "time_variance",
        ]

    async def update_model(
        self, model_type: ModelType, new_data: list[dict[str, Any]], labels: list[int] = None
    ):
        """Update model with new data (online learning)"""
        try:
            # Add new data to training data
            for data_point in new_data:
                self.training_data[model_type.value].append(data_point)

            # Retrain model with updated data
            all_data = list(self.training_data[model_type.value])
            await self.train_model(model_type, all_data, labels)

            logger.info(f"Updated {model_type.value} model with {len(new_data)} new samples")

        except Exception as e:
            logger.error(f"Error updating {model_type.value} model: {e}")

    def get_model_performance(self, model_type: ModelType = None) -> dict[str, ModelPerformance]:
        """Get model performance metrics"""
        if model_type:
            return {model_type.value: self.performance_metrics.get(model_type.value)}
        return dict(self.performance_metrics)

    def get_anomaly_statistics(self) -> dict[str, Any]:
        """Get anomaly detection statistics"""
        total_anomalies = len(self.anomaly_history)
        if total_anomalies == 0:
            return {
                "total_anomalies": 0,
                "anomaly_types": {},
                "severity_breakdown": {},
                "model_breakdown": {},
                "recent_anomalies": [],
            }

        # Anomaly type breakdown
        anomaly_types = defaultdict(int)
        severity_breakdown = defaultdict(int)
        model_breakdown = defaultdict(int)

        for anomaly in self.anomaly_history:
            anomaly_types[anomaly.anomaly_type.value] += 1
            severity_breakdown[anomaly.severity] += 1
            model_breakdown[anomaly.model_type.value] += 1

        return {
            "total_anomalies": total_anomalies,
            "anomaly_types": dict(anomaly_types),
            "severity_breakdown": dict(severity_breakdown),
            "model_breakdown": dict(model_breakdown),
            "recent_anomalies": [
                {
                    "anomaly_id": a.anomaly_id,
                    "anomaly_type": a.anomaly_type.value,
                    "confidence": a.confidence,
                    "severity": a.severity,
                    "timestamp": a.timestamp.isoformat(),
                }
                for a in list(self.anomaly_history)[-10:]  # Last 10 anomalies
            ],
        }

    async def save_models(self, filepath: str):
        """Save trained models to disk"""
        try:
            Path(filepath).mkdir(parents=True, exist_ok=True)

            # Save models
            for model_name, model in self.models.items():
                model_path = Path(filepath) / f"{model_name}.pkl"
                joblib.dump(model, model_path)

            # Save scalers
            scaler_path = Path(filepath) / "scalers.pkl"
            joblib.dump(self.scalers, scaler_path)

            # Save performance metrics
            metrics_path = Path(filepath) / "performance_metrics.pkl"
            joblib.dump(self.performance_metrics, metrics_path)

            logger.info(f"Models saved to {filepath}")

        except Exception as e:
            logger.error(f"Error saving models: {e}")

    async def load_models(self, filepath: str):
        """Load trained models from disk"""
        try:
            # Load models
            for model_name in self.models.keys():
                model_path = Path(filepath) / f"{model_name}.pkl"
                if model_path.exists():
                    self.models[model_name] = joblib.load(model_path)

            # Load scalers
            scaler_path = Path(filepath) / "scalers.pkl"
            if scaler_path.exists():
                self.scalers = joblib.load(scaler_path)

            # Load performance metrics
            metrics_path = Path(filepath) / "performance_metrics.pkl"
            if metrics_path.exists():
                self.performance_metrics = joblib.load(metrics_path)

            logger.info(f"Models loaded from {filepath}")

        except Exception as e:
            logger.error(f"Error loading models: {e}")

    def cleanup_old_data(self, max_age_hours: int = 24):
        """Clean up old data"""
        cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)

        # Clean anomaly history
        self.anomaly_history = deque(
            [a for a in self.anomaly_history if a.timestamp > cutoff_time], maxlen=100000
        )

        # Clean training data
        for model_name in self.training_data:
            self.training_data[model_name] = deque(
                [
                    d
                    for d in self.training_data[model_name]
                    if pd.to_datetime(d.get("timestamp", datetime.utcnow())) > cutoff_time
                ],
                maxlen=100000,
            )

        logger.info(f"Cleaned up data older than {max_age_hours} hours")
